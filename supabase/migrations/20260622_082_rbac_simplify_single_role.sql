-- =============================================================================
-- RBAC simplify — merge account_type + role_id → single `role` column
-- Reverts the over-engineered dynamic RBAC split; keeps `role` as the sole
-- business + authorization identifier, backed by FK → public.roles(name).
-- =============================================================================

-- 1) Add `role` column, backfill, drop old columns --------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50);

UPDATE public.users u
   SET role = COALESCE(
     (SELECT r.name FROM public.roles r WHERE r.id = u.role_id AND r.deleted_at IS NULL),
     u.account_type,
     'member'
   )
 WHERE u.role IS NULL;

ALTER TABLE public.users
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE public.users ADD CONSTRAINT chk_users_role CHECK (role IN ('member','company','admin'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE public.users ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES public.roles(name);

ALTER TABLE public.users DROP COLUMN IF EXISTS account_type;
ALTER TABLE public.users DROP COLUMN IF EXISTS role_id;

DROP INDEX IF EXISTS idx_users_account_type;
DROP INDEX IF EXISTS idx_users_account_type_status;
DROP INDEX IF EXISTS idx_users_active_account_type;
DROP INDEX IF EXISTS idx_users_active_recent;
DROP INDEX IF EXISTS idx_users_role_id;

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(status, role, deleted_at, created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active' AND role <> 'admin';

-- 2) Permission functions now use u.role directly (no role_id join needed) ---

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
       AND u.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
  p_user_id BIGINT,
  p_permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.roles r
        ON r.name = u.role
       AND r.deleted_at IS NULL
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND r.name = 'admin'
  )
  OR EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.role_permissions rp ON rp.role_id IN (SELECT id FROM public.roles WHERE name = u.role)
      JOIN public.permissions p ON p.id = rp.permission_id
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND p.name = p_permission_name
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(p_permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(public.auth_user_id(), p_permission_name);
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id BIGINT)
RETURNS TABLE(permission_name TEXT, module_name TEXT, action_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    JOIN public.role_permissions rp ON rp.role_id IN (SELECT id FROM public.roles WHERE name = u.role)
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
  UNION
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    CROSS JOIN public.permissions p
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
    JOIN public.roles r
      ON r.name = u.role
     AND r.deleted_at IS NULL
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
     AND r.name = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(BIGINT) TO anon, authenticated;

-- 3) handle_new_user — simplified, no more account_type / role_id ------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_user_id BIGINT;
  v_role TEXT;
  v_name TEXT;
  v_avatar TEXT;
  v_company_name TEXT;
  v_slug_base TEXT;
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('member', 'company', 'admin')
      THEN NEW.raw_user_meta_data->>'role'
    ELSE 'member'
  END;

  INSERT INTO public.users (auth_id, email, role, status, email_verified_at)
  VALUES (NEW.id, NEW.email, v_role, 'active', COALESCE(NEW.email_confirmed_at, NOW()))
  ON CONFLICT (auth_id) DO UPDATE
     SET email = EXCLUDED.email,
         email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at, NOW()),
         status = CASE
           WHEN public.users.status = 'pending_verification' THEN 'active'
           ELSE public.users.status
         END,
         updated_at = NOW()
  RETURNING id INTO v_new_user_id;

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Thành viên'
  );

  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', '')
  );

  IF v_role = 'company' THEN
    v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), v_name, 'Company');
    v_slug_base := COALESCE(
      NULLIF(trim(both '-' FROM regexp_replace(lower(v_company_name), '[^a-z0-9]+', '-', 'g')), ''),
      'company'
    );

    INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
    VALUES (
      v_new_user_id,
      v_company_name,
      v_slug_base || '-' || substring(NEW.id::text, 1, 8),
      v_avatar
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_role = 'member' THEN
    INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
    VALUES (v_new_user_id, v_name, v_avatar)
    ON CONFLICT (user_id) DO UPDATE
       SET full_name = COALESCE(public.member_profiles.full_name, EXCLUDED.full_name),
           avatar_url = COALESCE(public.member_profiles.avatar_url, EXCLUDED.avatar_url),
           updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Business RPCs — u.account_type → u.role ---------------------------------

-- 4a) is_company, is_member
CREATE OR REPLACE FUNCTION public.is_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.role = 'company'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_company() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.role = 'member'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_member() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_verified_company_user(p_user_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.company_profiles cp ON cp.user_id = u.id
     WHERE u.id = p_user_id
       AND u.role = 'company'
       AND u.status = 'active'
       AND cp.verification_status = 'verified'
       AND cp.deleted_at IS NULL
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_verified_company_user(BIGINT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_verified_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_verified_company_user(public.auth_user_id());
$$;

GRANT EXECUTE ON FUNCTION public.is_verified_company() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_active_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.company_profiles cp ON cp.user_id = u.id
     WHERE u.id = public.auth_user_id()
       AND u.role = 'company'
       AND u.status = 'active'
       AND cp.verification_status = 'verified'
       AND cp.deleted_at IS NULL
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_company() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.role = 'member'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_active_member() TO anon, authenticated;

-- 4b) get_admin_dashboard — role aggregates
CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_status TEXT;
  v_seven_days TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_stats JSONB;
  v_role_dist JSONB;
  v_status_dist JSONB;
  v_verif_dist JSONB;
  v_recent_acts JSONB;
BEGIN
  SELECT u.role, u.status
    INTO v_caller_role, v_caller_status
    FROM public.users u
   WHERE u.auth_id = auth.uid()
     AND u.deleted_at IS NULL
   LIMIT 1;

  IF v_caller_role IS DISTINCT FROM 'admin' OR v_caller_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
      'totalUsers', (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL),
      'newUsers7d', (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL AND created_at >= v_seven_days),
      'totalCompanies', (SELECT COUNT(*)::INT FROM public.users WHERE role = 'company' AND deleted_at IS NULL),
      'pendingCompanies', (SELECT COUNT(*)::INT FROM public.company_profiles WHERE verification_status IN ('pending','pending_update') AND deleted_at IS NULL),
      'totalJobs', (SELECT COUNT(*)::INT FROM public.jobs WHERE deleted_at IS NULL),
      'activeJobs', (SELECT COUNT(*)::INT FROM public.jobs WHERE status = 'active' AND deleted_at IS NULL),
      'totalApplications', (SELECT COUNT(*)::INT FROM public.job_applications),
      'pendingReports', (SELECT COUNT(*)::INT FROM public.reports WHERE status IN ('pending','in_review')),
      'totalPosts', (SELECT COUNT(*)::INT FROM public.posts WHERE deleted_at IS NULL AND status = 'active'),
      'totalConnections', (SELECT COUNT(*)::INT FROM public.connections WHERE status = 'accepted')
  ) INTO v_stats;

  SELECT COALESCE(jsonb_object_agg(role, cnt), '{}'::jsonb)
    INTO v_role_dist
    FROM (
      SELECT role, COUNT(*)::INT AS cnt
        FROM public.users
       WHERE deleted_at IS NULL
       GROUP BY role
    ) r;

  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
    INTO v_status_dist
    FROM (
      SELECT status, COUNT(*)::INT AS cnt
        FROM public.users
       WHERE deleted_at IS NULL
       GROUP BY status
    ) s;

  SELECT COALESCE(jsonb_object_agg(verification_status, cnt), '{}'::jsonb)
    INTO v_verif_dist
    FROM (
      SELECT verification_status, COUNT(*)::INT AS cnt
        FROM public.company_profiles
       WHERE deleted_at IS NULL
       GROUP BY verification_status
    ) v;

  SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_recent_acts
    FROM (
      SELECT a.id,
             a.action,
             a.entity_type AS "entityType",
             a.entity_id AS "entityId",
             a.reason,
             a.created_at AS "createdAt",
             jsonb_build_object(
               'id', u.id,
               'email', u.email,
               'displayName', COALESCE(mp.full_name, cp.name, u.email)
             ) AS actor
        FROM public.audit_logs a
        LEFT JOIN public.users u ON u.id = a.actor_id
        LEFT JOIN public.member_profiles mp ON mp.user_id = u.id AND mp.deleted_at IS NULL
        LEFT JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT 10
    ) x;

  RETURN jsonb_build_object(
    'stats', v_stats,
    'roleDist', v_role_dist,
    'statusDist', v_status_dist,
    'verificationDist', v_verif_dist,
    'recentActions', v_recent_acts
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO authenticated;

-- 4c) get_admin_dashboard_stats (alias if exists)
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

-- 4d) get_suggested_connections — uses generate_quick_suggestions which is updated below

-- 4e) get_network_overview
CREATE OR REPLACE FUNCTION public.get_network_overview(p_suggestion_limit INT DEFAULT 24)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_me BIGINT;
    v_suggestions JSONB; v_connections JSONB; v_incoming JSONB; v_outgoing JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('suggestions', '[]'::jsonb, 'connections', '[]'::jsonb,
            'incoming', '[]'::jsonb, 'outgoing', '[]'::jsonb);
    END IF;
    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (SELECT c.suggested_user_id AS "userId", u.role,
                   COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location"
              FROM public.network_suggestions c
              JOIN public.users u ON u.id = c.suggested_user_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = u.id
              LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE c.user_id = v_me ORDER BY RANDOM() LIMIT p_suggestion_limit) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_connections
      FROM (SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END AS "userId",
                   u.role, COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location",
                   c.id AS "connectionId",
                   COALESCE(c.responded_at, c.requested_at) AS "connectedAt"
              FROM public.connections c
              JOIN public.users u ON u.id = (CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END)
              LEFT JOIN public.member_profiles mp ON mp.user_id = u.id
              LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE (c.requester_id = v_me OR c.receiver_id = v_me) AND c.status = 'accepted'
             ORDER BY c.responded_at DESC NULLS LAST, c.requested_at DESC LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_incoming
      FROM (SELECT c.requester_id AS "userId", u.role,
                   COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location",
                   c.id AS "connectionId", c.requested_at AS "requestedAt", 'incoming' AS direction
              FROM public.connections c JOIN public.users u ON u.id = c.requester_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = c.requester_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = c.requester_id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE c.receiver_id = v_me AND c.status = 'pending'
             ORDER BY c.requested_at DESC LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_outgoing
      FROM (SELECT c.receiver_id AS "userId", u.role,
                   COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location",
                   c.id AS "connectionId", c.requested_at AS "requestedAt", 'outgoing' AS direction
              FROM public.connections c JOIN public.users u ON u.id = c.receiver_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = c.receiver_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = c.receiver_id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE c.requester_id = v_me AND c.status = 'pending'
             ORDER BY c.requested_at DESC LIMIT 50) s;

    RETURN jsonb_build_object('suggestions', v_suggestions, 'connections', v_connections,
        'incoming', v_incoming, 'outgoing', v_outgoing);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_overview(INT) TO authenticated;

-- 4f) get_profile_detail
CREATE OR REPLACE FUNCTION public.get_profile_detail(p_target_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_target public.users%ROWTYPE; v_is_owner BOOLEAN;
    v_relation JSONB; v_conn RECORD; v_profile JSONB;
    v_province JSONB; v_ward JSONB; v_is_visible BOOLEAN;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB;
    v_follower_cnt INT; v_is_following BOOLEAN; v_visibility TEXT;
    v_is_connected BOOLEAN := FALSE; v_is_admin BOOLEAN := FALSE;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN NULL; END IF;
    SELECT * INTO v_target FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL;
    IF v_target.id IS NULL THEN RETURN NULL; END IF;
    v_is_owner := (v_me = v_target.id);
    v_is_admin := public.is_admin();

    IF v_is_owner THEN v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me) LIMIT 1;
        IF v_conn.id IS NULL THEN v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN
            v_is_connected := TRUE;
            v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id); END IF;
    END IF;

    IF v_target.role = 'company' THEN
        SELECT to_jsonb(cp) INTO v_profile FROM public.company_profiles cp
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        IF v_profile IS NULL THEN RETURN NULL; END IF;
        IF NOT v_is_owner AND COALESCE(v_profile ->> 'verification_status', '') <> 'verified' THEN
            RETURN NULL;
        END IF;
        SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
          FROM public.company_profiles cp JOIN public.provinces pv ON pv.id = cp.province_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
          FROM public.company_profiles cp JOIN public.wards dt ON dt.id = cp.ward_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        SELECT COUNT(*)::INT INTO v_follower_cnt FROM public.follows f
         WHERE f.followable_type = 'company' AND f.followable_id = v_target.id;
        IF v_is_owner THEN v_is_following := FALSE;
        ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
             AND f.followable_type = 'company' AND f.followable_id = v_target.id) INTO v_is_following;
        END IF;
        RETURN jsonb_build_object('kind', 'company', 'isOwner', v_is_owner, 'relation', v_relation,
            'profile', v_profile, 'email', v_target.email, 'province', v_province, 'ward', v_ward,
            'profileViewCount', v_target.profile_view_count, 'connectionCount', v_target.connection_count,
            'followerCount', COALESCE(v_follower_cnt, 0), 'isFollowing', COALESCE(v_is_following, FALSE));
    END IF;

    SELECT to_jsonb(mp) INTO v_profile FROM public.member_profiles mp
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
      FROM public.member_profiles mp JOIN public.provinces pv ON pv.id = mp.province_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
      FROM public.member_profiles mp JOIN public.wards dt ON dt.id = mp.ward_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_follower_cnt FROM public.follows f
     WHERE f.followable_type = 'user' AND f.followable_id = v_target.id;
    IF v_is_owner THEN v_is_following := FALSE;
    ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
         AND f.followable_type = 'user' AND f.followable_id = v_target.id) INTO v_is_following;
    END IF;
    v_visibility := v_profile ->> 'profile_visibility';
    v_is_visible := v_is_admin OR v_is_owner OR v_visibility = 'public'
        OR (v_visibility = 'connections' AND v_is_connected);
    IF v_is_visible THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
          INTO v_experiences FROM public.member_experiences e WHERE e.user_id = v_target.id AND e.deleted_at IS NULL;
        SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC), '[]'::jsonb)
          INTO v_educations FROM public.member_educations ed WHERE ed.user_id = v_target.id AND ed.deleted_at IS NULL;
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
          INTO v_skills FROM public.member_skills ms
         WHERE ms.user_id = v_target.id;
    ELSE v_experiences := '[]'::jsonb; v_educations := '[]'::jsonb; v_skills := '[]'::jsonb;
         v_profile := jsonb_build_object(
            'id', v_profile -> 'id',
            'user_id', v_target.id,
            'full_name', '',
            'avatar_url', NULL,
            'cover_url', NULL,
            'headline', NULL,
            'about', NULL,
            'province_id', NULL,
            'ward_id', NULL,
            'website', NULL,
            'open_to_work', FALSE,
            'profile_visibility', v_visibility,
            'created_at', v_profile -> 'created_at',
            'updated_at', v_profile -> 'updated_at',
            'deleted_at', NULL
         );
         v_province := NULL;
         v_ward := NULL;
    END IF;
    RETURN jsonb_build_object('kind', 'member', 'isOwner', v_is_owner, 'relation', v_relation,
        'profile', v_profile, 'email', v_target.email, 'province', v_province, 'ward', v_ward,
        'profileViewCount', v_target.profile_view_count, 'connectionCount', v_target.connection_count,
        'followerCount', COALESCE(v_follower_cnt, 0), 'isFollowing', COALESCE(v_is_following, FALSE),
        'isVisible', v_is_visible, 'experiences', COALESCE(v_experiences, '[]'::jsonb),
        'educations', COALESCE(v_educations, '[]'::jsonb), 'skills', COALESCE(v_skills, '[]'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_detail(BIGINT) TO authenticated;

-- 4g) get_profile_edit_overview
CREATE OR REPLACE FUNCTION public.get_profile_edit_overview()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_email TEXT; v_role TEXT;
    v_profile JSONB; v_province JSONB; v_ward JSONB;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB; v_cvs JSONB; v_provinces JSONB;
BEGIN
    SELECT u.id, u.email, u.role INTO v_me, v_email, v_role
      FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'member' THEN RETURN NULL; END IF;
    SELECT to_jsonb(mp) INTO v_profile FROM public.member_profiles mp
     WHERE mp.user_id = v_me AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('id', p.id, 'name', p.name) INTO v_province
      FROM public.provinces p WHERE p.id = (v_profile->>'province_id')::BIGINT LIMIT 1;
    SELECT jsonb_build_object('id', d.id, 'name', d.name) INTO v_ward
      FROM public.wards d WHERE d.id = (v_profile->>'ward_id')::BIGINT LIMIT 1;
    SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
      INTO v_experiences FROM public.member_experiences e WHERE e.user_id = v_me AND e.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC NULLS LAST), '[]'::jsonb)
      INTO v_educations FROM public.member_educations ed WHERE ed.user_id = v_me AND ed.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
      INTO v_skills FROM public.member_skills ms WHERE ms.user_id = v_me;
    SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.is_default DESC, c.created_at DESC), '[]'::jsonb)
      INTO v_cvs FROM public.member_cvs c WHERE c.user_id = v_me AND c.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'code', p.code, 'name', p.name,
        'name_en', p.name_en, 'sort_order', p.sort_order, 'is_active', p.is_active) ORDER BY p.sort_order, p.name), '[]'::jsonb)
      INTO v_provinces FROM public.provinces p WHERE p.is_active = TRUE AND p.deleted_at IS NULL;
    RETURN jsonb_build_object('userId', v_me, 'email', v_email, 'profile', v_profile,
        'province', v_province, 'ward', v_ward, 'experiences', v_experiences,
        'educations', v_educations, 'skills', v_skills, 'cvs', v_cvs, 'provinces', v_provinces);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_edit_overview() TO authenticated;

-- 4h) get_company_public_overview (alias get_company_profile equivalent)
CREATE OR REPLACE FUNCTION public.get_company_public_overview(
    p_company_user_id BIGINT, p_jobs_limit INT DEFAULT 8
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_company JSONB; v_jobs JSONB;
    v_follower_count INT; v_jobs_count INT; v_is_following BOOLEAN; v_jobs_lim INT;
BEGIN
    v_jobs_lim := GREATEST(LEAST(COALESCE(p_jobs_limit, 8), 50), 1);
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT jsonb_build_object('userId', u.id, 'companyId', cp.id, 'name', cp.name,
        'slug', cp.slug, 'logoUrl', cp.logo_url, 'coverUrl', cp.cover_url,
        'about', cp.about, 'website', cp.website,
        'industry', cp.industry, 'size', cp.size, 'openToHire', cp.open_to_hire,
        'verificationStatus', cp.verification_status, 'provinceName', pv.name,
        'wardName', dt.name, 'businessAddress', cp.business_address,
        'businessEmail', cp.business_email, 'representativeName', cp.representative_name,
        'representativeTitle', cp.representative_title, 'createdAt', cp.created_at)
      INTO v_company FROM public.users u JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL
      LEFT JOIN public.provinces pv ON pv.id = cp.province_id LEFT JOIN public.wards dt ON dt.id = cp.ward_id
     WHERE u.id = p_company_user_id
       AND u.deleted_at IS NULL
       AND u.role = 'company'
       AND u.status = 'active'
       AND (u.id = v_me OR cp.verification_status = 'verified');
    IF v_company IS NULL THEN RETURN NULL; END IF;
    SELECT COUNT(*)::INT INTO v_jobs_count FROM public.jobs j
     WHERE j.company_user_id = p_company_user_id AND j.status = 'active'
       AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW());
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'salaryMin', x.salary_min,
        'salaryMax', x.salary_max, 'salaryVisible', x.salary_visible, 'provinceName', x.province_name,
        'wardName', x.ward_name, 'jobTypeName', x.job_type_name, 'workModeName', x.work_mode_name,
        'createdAt', x.created_at) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
                   pv.name AS province_name, dt.name AS ward_name, jt.name AS job_type_name,
                   wm.name AS work_mode_name, j.created_at
              FROM public.jobs j
              LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards dt ON dt.id = j.ward_id
              LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
             WHERE j.company_user_id = p_company_user_id AND j.status = 'active'
               AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW())
             ORDER BY j.created_at DESC LIMIT v_jobs_lim) x;
    SELECT COUNT(*)::INT INTO v_follower_count FROM public.follows f
     WHERE f.followable_type = 'company' AND f.followable_id = p_company_user_id;
    IF v_me IS NULL OR v_me = p_company_user_id THEN v_is_following := FALSE;
    ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
         AND f.followable_type = 'company' AND f.followable_id = p_company_user_id) INTO v_is_following;
    END IF;
    RETURN jsonb_build_object('company', v_company, 'jobsCount', v_jobs_count,
        'followerCount', v_follower_count, 'isFollowing', COALESCE(v_is_following, FALSE),
        'isOwner', COALESCE(v_me = p_company_user_id, FALSE), 'jobs', v_jobs);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public_overview(BIGINT, INT) TO authenticated;

-- 4i) toggle_follow_company (follow_company)
CREATE OR REPLACE FUNCTION public.toggle_follow_company(p_company_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_target_role TEXT; v_target_status TEXT; v_verification_status TEXT;
    v_existing BIGINT; v_is_following BOOLEAN; v_count INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_me = p_company_user_id THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'selfFollow'); END IF;
    SELECT u.role, u.status, cp.verification_status
      INTO v_target_role, v_target_status, v_verification_status
      FROM public.users u
      LEFT JOIN public.company_profiles cp
        ON cp.user_id = u.id
       AND cp.deleted_at IS NULL
     WHERE u.id = p_company_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound'); END IF;
    IF v_target_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_target_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    IF COALESCE(v_verification_status, '') <> 'verified' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound'); END IF;
    SELECT id INTO v_existing FROM public.follows
     WHERE follower_id = v_me AND followable_type = 'company' AND followable_id = p_company_user_id LIMIT 1;
    IF v_existing IS NOT NULL THEN DELETE FROM public.follows WHERE id = v_existing; v_is_following := FALSE;
    ELSE INSERT INTO public.follows(follower_id, followable_type, followable_id)
         VALUES (v_me, 'company', p_company_user_id) ON CONFLICT DO NOTHING; v_is_following := TRUE;
    END IF;
    SELECT COUNT(*)::INT INTO v_count FROM public.follows
     WHERE followable_type = 'company' AND followable_id = p_company_user_id;
    RETURN jsonb_build_object('ok', TRUE, 'isFollowing', v_is_following, 'followerCount', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow_company(BIGINT) TO authenticated;

-- 4j) toggle_follow_user
CREATE OR REPLACE FUNCTION public.toggle_follow_user(p_target_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_target_role TEXT; v_target_status TEXT;
    v_existing BIGINT; v_is_following BOOLEAN; v_count INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_me = p_target_user_id THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'selfFollow'); END IF;

    SELECT u.role, u.status INTO v_target_role, v_target_status
      FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'userNotFound'); END IF;
    IF v_target_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'userNotFound'); END IF;
    IF v_target_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'targetInactive'); END IF;

    SELECT id INTO v_existing FROM public.follows
     WHERE follower_id = v_me AND followable_type = 'user' AND followable_id = p_target_user_id LIMIT 1;
    IF v_existing IS NOT NULL THEN
        DELETE FROM public.follows WHERE id = v_existing;
        v_is_following := FALSE;
    ELSE
        INSERT INTO public.follows(follower_id, followable_type, followable_id)
        VALUES (v_me, 'user', p_target_user_id)
        ON CONFLICT DO NOTHING;
        v_is_following := TRUE;
    END IF;

    SELECT COUNT(*)::INT INTO v_count FROM public.follows
     WHERE followable_type = 'user' AND followable_id = p_target_user_id;
    RETURN jsonb_build_object('ok', TRUE, 'isFollowing', v_is_following, 'followerCount', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow_user(BIGINT) TO authenticated;

-- 4k) get_company_dashboard_overview
CREATE OR REPLACE FUNCTION public.get_company_dashboard_overview()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_active_jobs INT; v_total_apps INT;
    v_apps_this_month INT; v_hires_total INT; v_job_views INT;
    v_recent_jobs JSONB; v_recent_apps JSONB;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'company' THEN RETURN NULL; END IF;
    PERFORM public.expire_due_jobs();
    SELECT COUNT(*)::INT INTO v_active_jobs FROM public.jobs j
     WHERE j.company_user_id = v_me AND j.status = 'active' AND j.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_total_apps FROM public.job_applications a
     JOIN public.jobs j ON j.id = a.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_apps_this_month FROM public.job_applications a
     JOIN public.jobs j ON j.id = a.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
       AND a.applied_at >= date_trunc('month', NOW());
    SELECT COUNT(*)::INT INTO v_hires_total FROM public.job_applications a
     JOIN public.jobs j ON j.id = a.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL AND a.status = 'hired';
    SELECT COUNT(*)::INT INTO v_job_views FROM public.job_view_logs v
     JOIN public.jobs j ON j.id = v.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'status', x.status,
        'createdAt', x.created_at, 'expiresAt', x.expires_at, 'applicantCount', x.applicant_count,
        'viewCount', x.view_count) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_recent_jobs
      FROM (SELECT j.id, j.title,
                   CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL AND j.expires_at <= NOW()
                        THEN 'expired' ELSE j.status END AS status,
                   j.created_at, j.expires_at,
                   (SELECT COUNT(*)::INT FROM public.job_applications a WHERE a.job_id = j.id) AS applicant_count,
                   (SELECT COUNT(*)::INT FROM public.job_view_logs v WHERE v.job_id = j.id) AS view_count
              FROM public.jobs j WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
             ORDER BY j.created_at DESC LIMIT 5) x;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('applicationId', x.application_id, 'applicantId', x.applicant_id,
        'displayName', x.display_name, 'avatarUrl', x.avatar_url, 'headline', x.headline,
        'jobId', x.job_id, 'jobTitle', x.job_title, 'status', x.status, 'appliedAt', x.applied_at)
        ORDER BY x.applied_at DESC), '[]'::jsonb) INTO v_recent_apps
      FROM (SELECT a.id AS application_id, a.applicant_id,
                   COALESCE(mp.full_name, cp.name, u.email) AS display_name,
                   COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
                   COALESCE(mp.headline, cp.industry) AS headline,
                   j.id AS job_id, j.title AS job_title, a.status, a.applied_at
              FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
              JOIN public.users u ON u.id = a.applicant_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
              LEFT JOIN public.company_profiles cp ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
             WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
             ORDER BY a.applied_at DESC LIMIT 5) x;
    RETURN jsonb_build_object('stats', jsonb_build_object('activeJobs', v_active_jobs,
        'totalApplications', v_total_apps, 'applicationsThisMonth', v_apps_this_month,
        'jobViews', v_job_views, 'hireRate', CASE WHEN v_total_apps > 0
            THEN ROUND((v_hires_total::NUMERIC / v_total_apps) * 100, 1) ELSE 0 END),
        'recentJobs', v_recent_jobs, 'recentApplicants', v_recent_apps);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_dashboard_overview() TO authenticated;

-- 4l) get_company_jobs
CREATE OR REPLACE FUNCTION public.get_company_jobs(
    p_status TEXT DEFAULT 'all', p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');
    WITH base AS (
        SELECT j.*, CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL AND j.expires_at <= NOW()
                         THEN 'expired' ELSE j.status END AS effective_status
          FROM public.jobs j WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
           AND (p_status = 'all' OR (CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                 AND j.expires_at <= NOW() THEN 'expired' ELSE j.status END) = p_status)
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT b.id, b.title, b.effective_status AS status, b.created_at, b.expires_at,
               (SELECT COUNT(*)::INT FROM public.job_applications a WHERE a.job_id = b.id) AS applicant_count,
               (SELECT COUNT(*)::INT FROM public.job_view_logs v WHERE v.job_id = b.id) AS view_count
          FROM base b ORDER BY b.created_at DESC LIMIT v_lim OFFSET v_off
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title, 'status', p.status,
        'createdAt', p.created_at, 'expiresAt', p.expires_at, 'applicantCount', p.applicant_count,
        'viewCount', p.view_count) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted) INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_jobs(TEXT, TEXT, INT, INT) TO authenticated;

-- 4m) get_company_applicants
CREATE OR REPLACE FUNCTION public.get_company_applicants(
    p_job_id BIGINT DEFAULT NULL, p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL, p_limit INT DEFAULT 50, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');
    WITH base AS (
        SELECT a.id AS application_id, a.applicant_id, a.status, a.applied_at,
               a.cover_letter, a.resume_url, j.id AS job_id, j.title AS job_title,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline
          FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
           AND (p_job_id IS NULL OR a.job_id = p_job_id)
           AND (p_status = 'all' OR a.status = p_status)
           AND (v_q IS NULL OR COALESCE(mp.full_name, cp.name, u.email) ILIKE '%' || v_q || '%'
             OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (SELECT * FROM base ORDER BY applied_at DESC LIMIT v_lim OFFSET v_off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('applicationId', p.application_id, 'applicantId', p.applicant_id,
        'displayName', p.display_name, 'avatarUrl', p.avatar_url, 'headline', p.headline,
        'jobId', p.job_id, 'jobTitle', p.job_title, 'status', p.status, 'appliedAt', p.applied_at,
        'coverLetter', p.cover_letter, 'resumeUrl', p.resume_url) ORDER BY p.applied_at DESC), '[]'::jsonb),
        (SELECT total FROM counted) INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_applicants(BIGINT, TEXT, TEXT, INT, INT) TO authenticated;

-- 4n) update_application_status
CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id BIGINT, p_new_status TEXT, p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_company_user_id BIGINT; v_old_status TEXT; v_now TIMESTAMPTZ;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF p_new_status NOT IN ('applied','reviewed','interview','offered','hired','rejected','withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    SELECT j.company_user_id, a.status INTO v_company_user_id, v_old_status
      FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = p_application_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF p_new_status = 'withdrawn' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdraw'); END IF;
    IF v_old_status = p_new_status THEN RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status); END IF;
    v_now := NOW();
    UPDATE public.job_applications SET status = p_new_status, updated_at = v_now WHERE id = p_application_id;
    INSERT INTO public.application_status_history(application_id, old_status, new_status, changed_by, note, changed_at)
    VALUES (p_application_id, v_old_status, p_new_status, v_me, NULLIF(btrim(COALESCE(p_note, '')), ''), v_now);
    RETURN jsonb_build_object('ok', TRUE, 'noop', FALSE, 'status', p_new_status, 'oldStatus', v_old_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_application_status(BIGINT, TEXT, TEXT) TO authenticated;

-- 4o) update_job_status
CREATE OR REPLACE FUNCTION public.update_job_status(p_job_id BIGINT, p_new_status TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_company_user_id BIGINT; v_old_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF p_new_status NOT IN ('draft','active','closed') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    SELECT j.company_user_id, j.status INTO v_company_user_id, v_old_status
      FROM public.jobs j WHERE j.id = p_job_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status = 'removed' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobRemoved'); END IF;
    IF v_old_status = p_new_status THEN RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status); END IF;
    UPDATE public.jobs SET status = p_new_status, updated_at = NOW() WHERE id = p_job_id;
    RETURN jsonb_build_object('ok', TRUE, 'noop', FALSE, 'status', p_new_status, 'oldStatus', v_old_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_status(BIGINT, TEXT) TO authenticated;

-- 4p) create_job
CREATE OR REPLACE FUNCTION public.create_job(
    p_title TEXT, p_description TEXT, p_requirements TEXT,
    p_province_id BIGINT, p_ward_id BIGINT,
    p_salary_min BIGINT, p_salary_max BIGINT, p_salary_visible BOOLEAN,
    p_job_type_id BIGINT, p_work_mode_id BIGINT, p_job_position_id BIGINT,
    p_position_title TEXT, p_status TEXT, p_expires_at TIMESTAMPTZ, p_skills TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_status TEXT; v_job_id BIGINT;
    v_skill_name TEXT; v_skill_id BIGINT; v_pos_title TEXT;
BEGIN
    SELECT u.id, u.role, u.status INTO v_me, v_role, v_status FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    IF btrim(COALESCE(p_title, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle'); END IF;
    IF char_length(btrim(p_title)) > 255 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong'); END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription'); END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange'); END IF;
    IF p_status NOT IN ('draft', 'active') THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode'); END IF;
    IF p_province_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince'); END IF;
    v_pos_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_pos_title IS NOT NULL AND char_length(v_pos_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong'); END IF;

    INSERT INTO public.jobs(company_user_id, title, description, requirements,
        province_id, ward_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, position_title, status, expires_at)
    VALUES (v_me, btrim(p_title), btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_ward_id, p_salary_min, p_salary_max, COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, v_pos_title, p_status, p_expires_at)
    RETURNING id INTO v_job_id;
    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;
            SELECT id INTO v_skill_id FROM public.skills WHERE name = v_skill_name LIMIT 1;
            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_id;
            END IF;
            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (v_job_id, v_skill_id, TRUE) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'jobId', v_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN, BIGINT, BIGINT, BIGINT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

-- 4q) update_job
CREATE OR REPLACE FUNCTION public.update_job(
    p_job_id BIGINT, p_title TEXT, p_description TEXT, p_requirements TEXT,
    p_province_id BIGINT, p_ward_id BIGINT,
    p_salary_min BIGINT, p_salary_max BIGINT, p_salary_visible BOOLEAN,
    p_job_type_id BIGINT, p_work_mode_id BIGINT, p_position_title TEXT,
    p_expires_at TIMESTAMPTZ, p_skills TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_status TEXT; v_company_user_id BIGINT;
    v_old_status TEXT; v_skill_name TEXT; v_skill_id BIGINT; v_position_title TEXT;
BEGIN
    SELECT u.id, u.role, u.status INTO v_me, v_role, v_status FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    SELECT j.company_user_id, j.status INTO v_company_user_id, v_old_status
      FROM public.jobs j WHERE j.id = p_job_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status = 'removed' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobRemoved'); END IF;
    IF btrim(COALESCE(p_title, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle'); END IF;
    IF char_length(btrim(p_title)) > 255 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong'); END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription'); END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode'); END IF;
    IF p_province_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince'); END IF;
    v_position_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_position_title IS NOT NULL AND char_length(v_position_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong'); END IF;
    UPDATE public.jobs SET title = btrim(p_title), description = btrim(p_description),
        requirements = NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        province_id = p_province_id, ward_id = p_ward_id,
        salary_min = p_salary_min, salary_max = p_salary_max,
        salary_visible = COALESCE(p_salary_visible, TRUE),
        job_type_id = p_job_type_id, work_mode_id = p_work_mode_id,
        position_title = v_position_title, expires_at = p_expires_at, updated_at = NOW()
     WHERE id = p_job_id;
    DELETE FROM public.job_skills WHERE job_id = p_job_id;
    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;
            SELECT id INTO v_skill_id FROM public.skills WHERE name = v_skill_name LIMIT 1;
            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_id;
            END IF;
            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (p_job_id, v_skill_id, TRUE) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'jobId', p_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job(
    BIGINT, TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN, BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

-- 4r) apply_to_job (apply_job)
CREATE OR REPLACE FUNCTION public.apply_to_job(
    p_job_id BIGINT, p_cover_letter TEXT, p_resume_url TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_job_status TEXT; v_job_expires TIMESTAMPTZ; v_application_id BIGINT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly'); END IF;
    SELECT status, expires_at INTO v_job_status, v_job_expires
      FROM public.jobs WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;
    IF v_job_status IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_job_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotActive'); END IF;
    IF v_job_expires IS NOT NULL AND v_job_expires <= NOW() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobExpired'); END IF;
    IF EXISTS(SELECT 1 FROM public.job_applications WHERE job_id = p_job_id AND applicant_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'alreadyApplied'); END IF;
    IF p_cover_letter IS NOT NULL AND char_length(p_cover_letter) > 5000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'coverLetterTooLong'); END IF;
    INSERT INTO public.job_applications(job_id, applicant_id, resume_url, cover_letter, status)
    VALUES (p_job_id, v_me, NULLIF(btrim(COALESCE(p_resume_url, '')), ''),
            NULLIF(btrim(COALESCE(p_cover_letter, '')), ''), 'submitted')
    RETURNING id INTO v_application_id;
    RETURN jsonb_build_object('ok', TRUE, 'applicationId', v_application_id, 'status', 'submitted');
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(BIGINT, TEXT, TEXT) TO authenticated;

-- 4s) toggle_saved_job
CREATE OR REPLACE FUNCTION public.toggle_saved_job(p_job_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_role TEXT; v_existing INT; v_saved BOOLEAN;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id = p_job_id AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    SELECT 1 INTO v_existing FROM public.saved_jobs WHERE user_id = v_me AND job_id = p_job_id LIMIT 1;
    IF v_existing IS NOT NULL THEN DELETE FROM public.saved_jobs WHERE user_id = v_me AND job_id = p_job_id; v_saved := FALSE;
    ELSE INSERT INTO public.saved_jobs(user_id, job_id) VALUES (v_me, p_job_id) ON CONFLICT DO NOTHING; v_saved := TRUE; END IF;
    RETURN jsonb_build_object('ok', TRUE, 'saved', v_saved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_saved_job(BIGINT) TO authenticated;

-- 4t) resubmit_company_verification
CREATE OR REPLACE FUNCTION public.resubmit_company_verification()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_role TEXT; v_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    SELECT verification_status INTO v_status FROM public.company_profiles
     WHERE user_id = v_me AND deleted_at IS NULL LIMIT 1;
    IF v_status IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound'); END IF;
    IF v_status NOT IN ('rejected', 'pending_update') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notResubmittable'); END IF;
    UPDATE public.company_profiles SET verification_status = 'pending',
        verification_note = NULL, verified_by = NULL, verified_at = NULL, updated_at = NOW()
     WHERE user_id = v_me;
    RETURN jsonb_build_object('ok', TRUE, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubmit_company_verification() TO authenticated;

-- 4u) get_user_posts
CREATE OR REPLACE FUNCTION public.get_user_posts(
    p_target_user_id BIGINT, p_posts_cursor TIMESTAMPTZ DEFAULT NULL, p_posts_limit INT DEFAULT 10
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_is_owner BOOLEAN := FALSE; v_is_connected BOOLEAN := FALSE;
    v_is_admin BOOLEAN := FALSE; v_can_view BOOLEAN := TRUE;
    v_target_role VARCHAR(20); v_visibility VARCHAR(20); v_posts JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT u.role INTO v_target_role FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('posts', '[]'::jsonb, 'next_cursor', NULL, 'can_view', FALSE); END IF;
    v_is_owner := (v_me IS NOT NULL AND v_me = p_target_user_id);
    v_is_admin := public.is_admin();
    IF v_target_role = 'member' THEN
        SELECT mp.profile_visibility INTO v_visibility FROM public.member_profiles mp
         WHERE mp.user_id = p_target_user_id AND mp.deleted_at IS NULL LIMIT 1;
        IF v_visibility = 'private' AND NOT (v_is_owner OR v_is_admin) THEN
            v_can_view := FALSE;
        ELSIF v_visibility = 'connections' AND NOT (v_is_owner OR v_is_admin) THEN
            IF v_me IS NULL THEN
                v_can_view := FALSE;
            ELSE
                SELECT EXISTS(SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
                    AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
                      OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))) INTO v_is_connected;
                IF NOT v_is_connected THEN v_can_view := FALSE; END IF;
            END IF;
        END IF;
    END IF;
    IF NOT v_can_view THEN
        RETURN jsonb_build_object('posts', '[]'::jsonb, 'next_cursor', NULL, 'can_view', FALSE); END IF;
    IF v_me IS NOT NULL AND NOT v_is_owner THEN
        SELECT EXISTS(SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
            AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
              OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))) INTO v_is_connected;
    END IF;
    WITH feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at, p.reaction_count, p.comment_count, p.share_count
          FROM public.posts p
         WHERE p.author_id = p_target_user_id AND p.deleted_at IS NULL AND p.status = 'active'
           AND (v_is_admin OR v_is_owner OR p.visibility = 'public'
             OR (p.visibility = 'connections' AND v_is_connected))
           AND (p_posts_cursor IS NULL OR p.created_at < p_posts_cursor)
         ORDER BY p.created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.ord), '[]'::jsonb) INTO v_posts
      FROM (SELECT row_number() OVER (ORDER BY f.created_at DESC) AS ord,
                   f.id, f.author_id AS "authorId", f.content, f.post_type AS "postType",
                   f.media, f.visibility, f.created_at AS "createdAt",
                   jsonb_build_object('userId', f.author_id, 'role', au.role,
                       'displayName', COALESCE(amp.full_name, acp.name),
                       'avatarUrl', COALESCE(amp.avatar_url, acp.logo_url),
                       'headline', COALESCE(amp.headline, acp.industry)) AS author,
                   f.reaction_count AS "reactionCount", f.comment_count AS "commentCount",
                   f.share_count AS "shareCount",
                   CASE WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS(SELECT 1 FROM public.post_reactions r WHERE r.post_id = f.id AND r.user_id = v_me)
                   END AS "viewerReacted",
                   CASE WHEN f.post_type = 'poll' THEN (
                       SELECT COALESCE(jsonb_agg(jsonb_build_object('id', po.id, 'optionText', po.option_text,
                           'voteCount', po.vote_count, 'viewerVoted', CASE WHEN v_me IS NULL THEN FALSE
                               ELSE EXISTS(SELECT 1 FROM public.poll_votes pv WHERE pv.option_id = po.id AND pv.user_id = v_me)
                           END) ORDER BY po.id), '[]'::jsonb)
                       FROM public.poll_options po WHERE po.post_id = f.id)
                   ELSE NULL END AS "pollOptions"
              FROM feed f
              JOIN public.users au ON au.id = f.author_id
              LEFT JOIN public.member_profiles amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
              LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
        ) x;
    RETURN jsonb_build_object('posts', v_posts, 'next_cursor',
        (SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
          WHERE jsonb_array_length(v_posts) = p_posts_limit), 'can_view', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_posts(BIGINT, TIMESTAMPTZ, INT) TO anon, authenticated;

-- 4v) generate_quick_suggestions
CREATE OR REPLACE FUNCTION public.generate_quick_suggestions(p_user_id BIGINT, p_limit INT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    DELETE FROM public.network_suggestions WHERE user_id = p_user_id;
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT p_user_id, u.id, 1
      FROM public.users u
     WHERE u.deleted_at IS NULL
       AND u.status = 'active'
       AND u.role <> 'admin'
       AND u.id <> p_user_id
       AND NOT EXISTS (
         SELECT 1 FROM public.connections c
          WHERE (c.requester_id = p_user_id AND c.receiver_id = u.id)
             OR (c.requester_id = u.id AND c.receiver_id = p_user_id)
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocks b
          WHERE (b.blocker_id = p_user_id AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = p_user_id)
       )
       AND (
         (u.role = 'member' AND EXISTS (
            SELECT 1 FROM public.member_profiles mp
             WHERE mp.user_id = u.id
               AND mp.deleted_at IS NULL
               AND mp.profile_visibility = 'public'
          ))
         OR
         (u.role = 'company' AND EXISTS (
            SELECT 1 FROM public.company_profiles cp
             WHERE cp.user_id = u.id
               AND cp.deleted_at IS NULL
               AND cp.verification_status = 'verified'
          ))
       )
     ORDER BY u.id DESC LIMIT GREATEST(p_limit, 1) * 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_quick_suggestions(BIGINT, INT) TO authenticated;

-- 4w) refresh_network_suggestions
CREATE OR REPLACE FUNCTION public.refresh_network_suggestions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refreshed INT := 0;
  v_user RECORD;
BEGIN
  TRUNCATE public.network_suggestions;

  FOR v_user IN
    SELECT id FROM public.users
     WHERE role = 'member' AND status = 'active' AND deleted_at IS NULL
  LOOP
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT
      v_user.id,
      candidate.id,
      (
        SELECT COUNT(DISTINCT uc2.to_user_id)
        FROM public.user_connections_view uc1
        JOIN public.user_connections_view uc2
          ON uc1.to_user_id = uc2.to_user_id AND uc2.status = 'accepted'
        WHERE uc1.from_user_id = v_user.id
          AND uc1.status = 'accepted'
          AND uc2.from_user_id = candidate.id
      ) * 10
      +
      (
        SELECT COUNT(DISTINCT ms2.skill_id)
        FROM public.member_skills ms1
        JOIN public.member_skills ms2 ON ms1.skill_id = ms2.skill_id
        WHERE ms1.user_id = v_user.id AND ms2.user_id = candidate.id
      ) * 5
    AS score
    FROM public.users candidate
    WHERE candidate.id <> v_user.id
      AND candidate.role = 'member'
      AND candidate.status = 'active'
      AND candidate.deleted_at IS NULL
      AND candidate.id NOT IN (
        SELECT to_user_id FROM public.user_connections_view
         WHERE from_user_id = v_user.id
      )
    ORDER BY score DESC
    LIMIT 20
    ON CONFLICT DO NOTHING;

    v_refreshed := v_refreshed + 1;
  END LOOP;

  RETURN v_refreshed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_network_suggestions() TO service_role;

-- 4x) get_messaging_overview / get_conversations equivalent
CREATE OR REPLACE FUNCTION public.get_messaging_overview(p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_me BIGINT; v_items JSONB; v_unread_total INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0); END IF;
    WITH my_conv AS (
        SELECT cp.conversation_id, cp.last_read_at, cp.unread_count
          FROM public.conversation_participants cp WHERE cp.user_id = v_me
    ),
    other_part AS (
        SELECT mc.conversation_id, cp.user_id AS other_user_id, mc.unread_count
          FROM my_conv mc JOIN public.conversation_participants cp
            ON cp.conversation_id = mc.conversation_id AND cp.user_id <> v_me
    ),
    convo_rows AS (
        SELECT c.id AS "conversationId", c.updated_at AS "updatedAt", c.seq AS "seq",
               op.other_user_id AS "otherUserId",
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline", u.role,
               c.last_message_id AS "lastMessageId", c.last_sender_id AS "lastSenderId",
               c.last_content AS "lastContent", NULL::JSONB AS "lastMedia",
               c.last_message_created_at AS "lastCreatedAt",
               op.unread_count AS "unreadCount",
               TRUE AS "isConnected",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = v_me AND ub.blocked_id = op.other_user_id) AS "blockedByMe",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = op.other_user_id AND ub.blocked_id = v_me) AS "blockedMe",
               COALESCE(c.last_message_created_at, c.updated_at) AS sort_key
          FROM other_part op
          JOIN public.conversations c ON c.id = op.conversation_id
          JOIN public.users u ON u.id = op.other_user_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = op.other_user_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = op.other_user_id AND cp.deleted_at IS NULL
    ),
    my_connections AS (
        SELECT CASE WHEN cn.requester_id = v_me THEN cn.receiver_id ELSE cn.requester_id END AS other_id,
               COALESCE(cn.responded_at, cn.requested_at) AS connected_at
          FROM public.connections cn
         WHERE cn.status = 'accepted' AND (cn.requester_id = v_me OR cn.receiver_id = v_me)
    ),
    connections_without_convo AS (
        SELECT mc.other_id, mc.connected_at FROM my_connections mc
         WHERE mc.other_id NOT IN (SELECT "otherUserId" FROM convo_rows)
    ),
    placeholder_rows AS (
        SELECT NULL::BIGINT AS "conversationId", cwc.connected_at AS "updatedAt", NULL::INT AS "seq",
               cwc.other_id AS "otherUserId",
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline", u.role,
               NULL::BIGINT AS "lastMessageId", NULL::BIGINT AS "lastSenderId",
               NULL::TEXT AS "lastContent", NULL::JSONB AS "lastMedia",
               NULL::TIMESTAMPTZ AS "lastCreatedAt", 0::INT AS "unreadCount",
               TRUE AS "isConnected",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = v_me AND ub.blocked_id = cwc.other_id) AS "blockedByMe",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = cwc.other_id AND ub.blocked_id = v_me) AS "blockedMe",
               cwc.connected_at AS sort_key
          FROM connections_without_convo cwc
          JOIN public.users u ON u.id = cwc.other_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = cwc.other_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = cwc.other_id AND cp.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'conversationId', ar."conversationId", 'updatedAt', ar."updatedAt", 'seq', ar."seq",
        'otherUserId', ar."otherUserId", 'displayName', ar."displayName",
        'avatarUrl', ar."avatarUrl", 'headline', ar."headline", 'role', ar.role,
        'lastMessageId', ar."lastMessageId", 'lastSenderId', ar."lastSenderId",
        'lastContent', ar."lastContent", 'lastMedia', ar."lastMedia",
        'lastCreatedAt', ar."lastCreatedAt", 'unreadCount', ar."unreadCount",
        'isConnected', ar."isConnected", 'blockedByMe', ar."blockedByMe",
        'blockedMe', ar."blockedMe"
    ) ORDER BY ar.sort_key DESC NULLS LAST), '[]'::jsonb) INTO v_items
      FROM (
          SELECT * FROM convo_rows UNION ALL SELECT * FROM placeholder_rows
          ORDER BY sort_key DESC NULLS LAST LIMIT p_limit
      ) ar;

    SELECT COUNT(*)::INT INTO v_unread_total
      FROM public.conversation_participants cp
     WHERE cp.user_id = v_me AND cp.unread_count > 0;

    RETURN jsonb_build_object('items', v_items, 'unreadConversations', v_unread_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_messaging_overview(INT) TO authenticated;

-- 5) Update audit log trigger (OLD.account_type → OLD.role) -----------------

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_users() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'users', NEW.id,
           jsonb_build_object('email', OLD.email, 'role', OLD.role, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$;

-- 6) Update views ------------------------------------------------------------

CREATE OR REPLACE VIEW public.v_active_members
WITH (security_invoker = true) AS
SELECT u.id, u.auth_id, u.email, u.role, u.status,
       mp.full_name, mp.avatar_url, mp.headline,
       mp.province_id, p.name AS province_name,
       mp.ward_id, w.name AS ward_name,
       mp.open_to_work, mp.profile_visibility
  FROM public.users u
  JOIN public.member_profiles mp ON mp.user_id = u.id
  LEFT JOIN public.provinces p ON p.id = mp.province_id
  LEFT JOIN public.wards w ON w.id = mp.ward_id
 WHERE u.role = 'member'
   AND u.status = 'active'
   AND u.deleted_at IS NULL
   AND mp.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.v_verified_companies
WITH (security_invoker = true) AS
SELECT u.id, u.auth_id, u.email,
       cp.name, cp.slug, cp.logo_url, cp.industry, cp.size,
       cp.province_id, p.name AS province_name,
       cp.ward_id, w.name AS ward_name,
       cp.open_to_hire, cp.verified_at
  FROM public.users u
  JOIN public.company_profiles cp ON cp.user_id = u.id
  LEFT JOIN public.provinces p ON p.id = cp.province_id
  LEFT JOIN public.wards w ON w.id = cp.ward_id
 WHERE u.role = 'company'
   AND u.status = 'active'
   AND cp.verification_status = 'verified'
   AND u.deleted_at IS NULL
   AND cp.deleted_at IS NULL;

-- 7) Update RLS policies that reference account_type ------------------------

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT WITH CHECK (
    follower_id = public.auth_user_id()
    AND public.is_active_user()
    AND followable_id <> follower_id
    AND (
      (
        followable_type = 'user'
        AND EXISTS (
          SELECT 1
            FROM public.users u
           WHERE u.id = followable_id
             AND u.role = 'member'
             AND u.status = 'active'
             AND u.deleted_at IS NULL
        )
      )
      OR (
        followable_type = 'company'
        AND EXISTS (
          SELECT 1
            FROM public.users u
            JOIN public.company_profiles cp
              ON cp.user_id = u.id
             AND cp.deleted_at IS NULL
             AND cp.verification_status = 'verified'
           WHERE u.id = followable_id
             AND u.role = 'company'
             AND u.status = 'active'
             AND u.deleted_at IS NULL
        )
      )
    )
  );

-- Update contact_submissions RLS (already uses is_admin, no account_type ref)

-- 8) Re-assert RLS + grants for RBAC tables (idempotent) ---------------------

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_admin_all" ON public.roles;
DROP POLICY IF EXISTS "modules_authenticated_read" ON public.modules;
DROP POLICY IF EXISTS "actions_authenticated_read" ON public.actions;
DROP POLICY IF EXISTS "permissions_authenticated_read" ON public.permissions;
DROP POLICY IF EXISTS "role_permissions_admin_all" ON public.role_permissions;

CREATE POLICY "roles_admin_all" ON public.roles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "modules_authenticated_read" ON public.modules
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "actions_authenticated_read" ON public.actions
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "permissions_authenticated_read" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "role_permissions_admin_all" ON public.role_permissions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.roles FROM authenticated;
REVOKE ALL ON public.modules FROM authenticated;
REVOKE ALL ON public.actions FROM authenticated;
REVOKE ALL ON public.permissions FROM authenticated;
REVOKE ALL ON public.role_permissions FROM authenticated;

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.actions TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.actions TO service_role;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.role_permissions TO service_role;

NOTIFY pgrst, 'reload schema';
