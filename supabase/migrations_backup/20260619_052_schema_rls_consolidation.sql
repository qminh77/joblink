-- =============================================================================
-- JOBLINK MIGRATION 20260619_052 — SCHEMA/RLS CONSOLIDATION
-- =============================================================================
-- Mục tiêu:
--   • Vá DB đã chạy nếu schema cũ thiếu profile sau OAuth / Google login.
--   • Bật RLS và policy đầy đủ cho toàn bộ bảng public của app.
--   • Chặn user_connections_view bypass RLS.
--   • Làm sạch suggestions để không trả user thiếu profile hoặc bị block.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Auth trigger + backfill profile bị thiếu
-- -----------------------------------------------------------------------------

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
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    'active',
    COALESCE(NEW.email_confirmed_at, NOW())
  )
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
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.users (auth_id, email, role, status, email_verified_at)
SELECT au.id,
       au.email,
       CASE
         WHEN au.raw_user_meta_data->>'role' IN ('member', 'company', 'admin')
           THEN au.raw_user_meta_data->>'role'
         ELSE 'member'
       END,
       'active',
       COALESCE(au.email_confirmed_at, NOW())
  FROM auth.users au
 WHERE au.email IS NOT NULL
ON CONFLICT (auth_id) DO UPDATE
SET email = EXCLUDED.email,
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at, NOW()),
    status = CASE
      WHEN public.users.status = 'pending_verification' THEN 'active'
      ELSE public.users.status
    END,
    updated_at = NOW();

INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
SELECT u.id,
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'full_name', ''),
         NULLIF(au.raw_user_meta_data->>'name', ''),
         split_part(u.email, '@', 1),
         'Thành viên'
       ),
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'avatar_url', ''),
         NULLIF(au.raw_user_meta_data->>'picture', '')
       )
  FROM public.users u
  JOIN auth.users au ON au.id = u.auth_id
 WHERE u.role = 'member'
   AND u.deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
SELECT u.id,
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'company_name', ''),
         NULLIF(au.raw_user_meta_data->>'name', ''),
         split_part(u.email, '@', 1),
         'Company'
       ),
       COALESCE(
         NULLIF(trim(both '-' FROM regexp_replace(
           lower(COALESCE(
             NULLIF(au.raw_user_meta_data->>'company_name', ''),
             NULLIF(au.raw_user_meta_data->>'name', ''),
             split_part(u.email, '@', 1),
             'Company'
           )),
           '[^a-z0-9]+', '-', 'g'
         )), ''),
         'company'
       ) || '-' || substring(u.auth_id::text, 1, 8),
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'avatar_url', ''),
         NULLIF(au.raw_user_meta_data->>'picture', '')
       )
  FROM public.users u
  JOIN auth.users au ON au.id = u.auth_id
 WHERE u.role = 'company'
   AND u.deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. RLS-safe connection view + cleaner suggestions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.user_connections_view
WITH (security_invoker = true) AS
SELECT requester_id AS from_user_id, receiver_id AS to_user_id, status,
       COALESCE(responded_at, requested_at) AS connected_at
  FROM public.connections
UNION ALL
SELECT receiver_id AS from_user_id, requester_id AS to_user_id, status,
       COALESCE(responded_at, requested_at) AS connected_at
  FROM public.connections;

GRANT SELECT ON public.user_connections_view TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_quick_suggestions(p_user_id BIGINT, p_limit INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
   ORDER BY u.id DESC
   LIMIT GREATEST(p_limit, 1) * 5;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_quick_suggestions(BIGINT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. Profile RPCs đồng bộ member_skills.name
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_profile_detail(p_target_user_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_me BIGINT; v_target public.users%ROWTYPE; v_is_owner BOOLEAN;
    v_relation JSONB; v_conn RECORD; v_profile JSONB;
    v_province JSONB; v_ward JSONB; v_is_visible BOOLEAN;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB;
    v_follower_cnt INT; v_is_following BOOLEAN; v_visibility TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN NULL; END IF;

    SELECT * INTO v_target FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL;
    IF v_target.id IS NULL THEN RETURN NULL; END IF;

    v_is_owner := (v_me = v_target.id);

    IF v_is_owner THEN
        v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn
          FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me)
         LIMIT 1;

        IF v_conn.id IS NULL THEN
            v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN
            v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN
            v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN
            v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN
            v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE
            v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id);
        END IF;
    END IF;

    IF v_target.role = 'company' THEN
        SELECT to_jsonb(cp) INTO v_profile
          FROM public.company_profiles cp
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        IF v_profile IS NULL THEN RETURN NULL; END IF;
        IF NOT v_is_owner AND COALESCE(v_profile ->> 'verification_status', '') <> 'verified' THEN
            RETURN NULL;
        END IF;

        SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
          FROM public.company_profiles cp
          JOIN public.provinces pv ON pv.id = cp.province_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;

        SELECT jsonb_build_object('id', w.id, 'name', w.name) INTO v_ward
          FROM public.company_profiles cp
          JOIN public.wards w ON w.id = cp.ward_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;

        SELECT COUNT(*)::INT INTO v_follower_cnt
          FROM public.follows f
         WHERE f.followable_type = 'company'
           AND f.followable_id = v_target.id;

        IF v_is_owner THEN
            v_is_following := FALSE;
        ELSE
            SELECT EXISTS(
                SELECT 1 FROM public.follows f
                 WHERE f.follower_id = v_me
                   AND f.followable_type = 'company'
                   AND f.followable_id = v_target.id
            ) INTO v_is_following;
        END IF;

        RETURN jsonb_build_object(
            'kind', 'company',
            'isOwner', v_is_owner,
            'relation', v_relation,
            'profile', v_profile,
            'email', v_target.email,
            'province', v_province,
            'ward', v_ward,
            'profileViewCount', v_target.profile_view_count,
            'connectionCount', v_target.connection_count,
            'followerCount', COALESCE(v_follower_cnt, 0),
            'isFollowing', COALESCE(v_is_following, FALSE)
        );
    END IF;

    SELECT to_jsonb(mp) INTO v_profile
      FROM public.member_profiles mp
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;

    SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
      FROM public.member_profiles mp
      JOIN public.provinces pv ON pv.id = mp.province_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;

    SELECT jsonb_build_object('id', w.id, 'name', w.name) INTO v_ward
      FROM public.member_profiles mp
      JOIN public.wards w ON w.id = mp.ward_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;

    v_visibility := v_profile ->> 'profile_visibility';
    v_is_visible := (v_visibility IS DISTINCT FROM 'private') OR v_is_owner;

    IF v_is_visible THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
          INTO v_experiences
          FROM public.member_experiences e
         WHERE e.user_id = v_target.id AND e.deleted_at IS NULL;

        SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC), '[]'::jsonb)
          INTO v_educations
          FROM public.member_educations ed
         WHERE ed.user_id = v_target.id AND ed.deleted_at IS NULL;

        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
          INTO v_skills
          FROM public.member_skills ms
         WHERE ms.user_id = v_target.id;
    ELSE
        v_experiences := '[]'::jsonb;
        v_educations := '[]'::jsonb;
        v_skills := '[]'::jsonb;
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

    RETURN jsonb_build_object(
        'kind', 'member',
        'isOwner', v_is_owner,
        'relation', v_relation,
        'profile', v_profile,
        'email', v_target.email,
        'province', v_province,
        'ward', v_ward,
        'profileViewCount', v_target.profile_view_count,
        'connectionCount', v_target.connection_count,
        'isVisible', v_is_visible,
        'experiences', COALESCE(v_experiences, '[]'::jsonb),
        'educations', COALESCE(v_educations, '[]'::jsonb),
        'skills', COALESCE(v_skills, '[]'::jsonb)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_edit_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT; v_email TEXT; v_role TEXT;
    v_profile JSONB; v_province JSONB; v_ward JSONB;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB;
    v_cvs JSONB; v_provinces JSONB;
BEGIN
    SELECT u.id, u.email, u.role INTO v_me, v_email, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;
    IF v_me IS NULL OR v_role <> 'member' THEN RETURN NULL; END IF;

    SELECT to_jsonb(mp) INTO v_profile
      FROM public.member_profiles mp
     WHERE mp.user_id = v_me AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;

    SELECT jsonb_build_object('id', p.id, 'name', p.name) INTO v_province
      FROM public.provinces p
     WHERE p.id = (v_profile->>'province_id')::BIGINT LIMIT 1;

    SELECT jsonb_build_object('id', w.id, 'name', w.name) INTO v_ward
      FROM public.wards w
     WHERE w.id = (v_profile->>'ward_id')::BIGINT LIMIT 1;

    SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
      INTO v_experiences
      FROM public.member_experiences e
     WHERE e.user_id = v_me AND e.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC NULLS LAST), '[]'::jsonb)
      INTO v_educations
      FROM public.member_educations ed
     WHERE ed.user_id = v_me AND ed.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
      INTO v_skills
      FROM public.member_skills ms
     WHERE ms.user_id = v_me;

    SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.is_default DESC, c.created_at DESC), '[]'::jsonb)
      INTO v_cvs
      FROM public.member_cvs c
     WHERE c.user_id = v_me AND c.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id', p.id,
             'code', p.code,
             'name', p.name,
             'name_en', p.name_en,
             'sort_order', p.sort_order,
             'is_active', p.is_active
           ) ORDER BY p.sort_order, p.name), '[]'::jsonb)
      INTO v_provinces
      FROM public.provinces p
     WHERE p.is_active = TRUE AND p.deleted_at IS NULL;

    RETURN jsonb_build_object(
        'userId', v_me,
        'email', v_email,
        'profile', v_profile,
        'province', v_province,
        'ward', v_ward,
        'experiences', v_experiences,
        'educations', v_educations,
        'skills', v_skills,
        'cvs', v_cvs,
        'provinces', v_provinces
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_detail(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_edit_overview() TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RLS helper functions
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS BIGINT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id
    FROM public.users u
   WHERE u.auth_id::text = auth.uid()::text
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.role = 'admin'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.role = 'company'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.role = 'member'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.are_connected(p_a BIGINT, p_b BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections c
     WHERE c.status = 'accepted'
       AND ((c.requester_id = p_a AND c.receiver_id = p_b)
         OR (c.requester_id = p_b AND c.receiver_id = p_a))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_connected_with(p_user_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.are_connected(public.auth_user_id(), p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.can_view_member_profile(target_user_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles mp
     WHERE mp.user_id = target_user_id
       AND mp.deleted_at IS NULL
       AND (
            public.is_admin()
         OR mp.user_id = public.auth_user_id()
         OR mp.profile_visibility = 'public'
         OR (mp.profile_visibility = 'connections'
             AND public.are_connected(public.auth_user_id(), mp.user_id))
       )
  );
$$;

CREATE OR REPLACE FUNCTION public.company_owns_job(p_job_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
     WHERE j.id = p_job_id
       AND j.company_user_id = public.auth_user_id()
       AND j.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.company_owns_application(p_application_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
     WHERE ja.id = p_application_id
       AND j.company_user_id = public.auth_user_id()
       AND j.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_post(post_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.posts p
     WHERE p.id = can_view_post.post_id
       AND p.deleted_at IS NULL
       AND (
            public.is_admin()
         OR p.author_id = public.auth_user_id()
         OR (p.status = 'active' AND p.visibility = 'public')
         OR (p.status = 'active'
             AND p.visibility = 'connections'
             AND public.are_connected(public.auth_user_id(), p.author_id))
       )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_conversation(p_conversation_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id
       AND cp.user_id = public.auth_user_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_company() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_member() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.are_connected(BIGINT, BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_connected_with(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_member_profile(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_owns_job(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_owns_application(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_post(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_conversation(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. Rebuild public RLS policies
-- -----------------------------------------------------------------------------

DO $rls$
DECLARE
  r RECORD;
  v_tables TEXT[] := ARRAY[
    'users','provinces','wards','job_types','work_modes','job_positions',
    'member_profiles','member_experiences','member_educations','skills',
    'member_skills','profile_view_logs','member_cvs','company_profiles',
    'posts','poll_options','poll_votes','post_reactions','post_comments',
    'post_shares','connections','follows','jobs','job_skills',
    'job_applications','application_status_history','interview_schedules',
    'saved_jobs','job_alerts','job_view_logs','conversations',
    'conversation_participants','messages','user_blocks','notifications',
    'notification_preferences','report_types','reports','moderation_actions',
    'appeals','audit_logs','system_settings','network_suggestions','user_feeds'
  ];
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = ANY (v_tables)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$rls$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = public.auth_user_id());
CREATE POLICY users_select_active_authenticated ON public.users
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND status NOT IN ('banned', 'deleted'));
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (id = public.auth_user_id());

CREATE POLICY member_profiles_admin_all ON public.member_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_profiles_select_visible ON public.member_profiles
  FOR SELECT USING (
    user_id = public.auth_user_id()
    OR profile_visibility = 'public'
    OR (profile_visibility = 'connections'
        AND public.are_connected(public.auth_user_id(), user_id))
  );
CREATE POLICY member_profiles_insert_own ON public.member_profiles
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_profiles_update_own ON public.member_profiles
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_profiles_delete_own ON public.member_profiles
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY member_experiences_admin_all ON public.member_experiences
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_experiences_select_visible ON public.member_experiences
  FOR SELECT USING (public.can_view_member_profile(user_id));
CREATE POLICY member_experiences_insert_own ON public.member_experiences
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_experiences_update_own ON public.member_experiences
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_experiences_delete_own ON public.member_experiences
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY member_educations_admin_all ON public.member_educations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_educations_select_visible ON public.member_educations
  FOR SELECT USING (public.can_view_member_profile(user_id));
CREATE POLICY member_educations_insert_own ON public.member_educations
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_educations_update_own ON public.member_educations
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_educations_delete_own ON public.member_educations
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY skills_select_all ON public.skills FOR SELECT USING (TRUE);
CREATE POLICY skills_insert_authenticated ON public.skills
  FOR INSERT TO authenticated WITH CHECK (public.auth_user_id() IS NOT NULL);
CREATE POLICY skills_admin_all ON public.skills
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY member_skills_admin_all ON public.member_skills
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_skills_select_visible ON public.member_skills
  FOR SELECT USING (public.can_view_member_profile(user_id));
CREATE POLICY member_skills_insert_own ON public.member_skills
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_skills_update_own ON public.member_skills
  FOR UPDATE USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_skills_delete_own ON public.member_skills
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY profile_view_logs_admin_all ON public.profile_view_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY profile_view_logs_select_target ON public.profile_view_logs
  FOR SELECT USING (target_user_id = public.auth_user_id());
CREATE POLICY profile_view_logs_insert_viewer ON public.profile_view_logs
  FOR INSERT WITH CHECK (viewer_user_id = public.auth_user_id());

CREATE POLICY member_cvs_admin_all ON public.member_cvs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_cvs_select_own ON public.member_cvs
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY member_cvs_insert_own ON public.member_cvs
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_cvs_update_own ON public.member_cvs
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY member_cvs_delete_own ON public.member_cvs
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY company_profiles_admin_all ON public.company_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY company_profiles_select_visible ON public.company_profiles
  FOR SELECT USING (
    user_id = public.auth_user_id()
    OR verification_status = 'verified'
  );
CREATE POLICY company_profiles_insert_own ON public.company_profiles
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_company());
CREATE POLICY company_profiles_update_own ON public.company_profiles
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY company_profiles_delete_own ON public.company_profiles
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY posts_admin_all ON public.posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY posts_select_visible ON public.posts
  FOR SELECT USING (public.can_view_post(id));
CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT WITH CHECK (author_id = public.auth_user_id());
CREATE POLICY posts_update_own ON public.posts
  FOR UPDATE USING (author_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (author_id = public.auth_user_id());
CREATE POLICY posts_delete_own ON public.posts
  FOR DELETE USING (author_id = public.auth_user_id());

CREATE POLICY poll_options_admin_all ON public.poll_options
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY poll_options_select_visible ON public.poll_options
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY poll_options_insert_own ON public.poll_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );
CREATE POLICY poll_options_update_own ON public.poll_options
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );
CREATE POLICY poll_options_delete_own ON public.poll_options
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );

CREATE POLICY poll_votes_admin_all ON public.poll_votes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY poll_votes_select_visible ON public.poll_votes
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY poll_votes_insert_own ON public.poll_votes
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));
CREATE POLICY poll_votes_delete_own ON public.poll_votes
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY post_reactions_admin_all ON public.post_reactions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY post_reactions_select_visible ON public.post_reactions
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY post_reactions_insert_own ON public.post_reactions
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));
CREATE POLICY post_reactions_delete_own ON public.post_reactions
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY post_comments_admin_all ON public.post_comments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY post_comments_select_visible ON public.post_comments
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY post_comments_insert_own ON public.post_comments
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));
CREATE POLICY post_comments_update_own ON public.post_comments
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY post_comments_delete_own ON public.post_comments
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY post_shares_admin_all ON public.post_shares
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY post_shares_select_visible ON public.post_shares
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY post_shares_insert_own ON public.post_shares
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));
CREATE POLICY post_shares_delete_own ON public.post_shares
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY connections_admin_all ON public.connections
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY connections_select_involved ON public.connections
  FOR SELECT USING (requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id());
CREATE POLICY connections_insert_own ON public.connections
  FOR INSERT WITH CHECK (requester_id = public.auth_user_id());
CREATE POLICY connections_update_involved ON public.connections
  FOR UPDATE USING (requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id())
  WITH CHECK (requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id());
CREATE POLICY connections_delete_involved ON public.connections
  FOR DELETE USING (requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id());

CREATE POLICY follows_admin_all ON public.follows
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY follows_select_all ON public.follows FOR SELECT USING (TRUE);
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT WITH CHECK (follower_id = public.auth_user_id());
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE USING (follower_id = public.auth_user_id());

CREATE POLICY jobs_admin_all ON public.jobs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY jobs_select_visible ON public.jobs
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      company_user_id = public.auth_user_id()
      OR (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()))
    )
  );
CREATE POLICY jobs_insert_own ON public.jobs
  FOR INSERT WITH CHECK (company_user_id = public.auth_user_id() AND public.is_company());
CREATE POLICY jobs_update_own ON public.jobs
  FOR UPDATE USING (company_user_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (company_user_id = public.auth_user_id());
CREATE POLICY jobs_delete_own ON public.jobs
  FOR DELETE USING (company_user_id = public.auth_user_id());

CREATE POLICY job_skills_admin_all ON public.job_skills
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_skills_select_visible ON public.job_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
       WHERE j.id = job_id
         AND j.deleted_at IS NULL
         AND (j.company_user_id = public.auth_user_id()
              OR (j.status = 'active' AND (j.expires_at IS NULL OR j.expires_at > NOW())))
    )
  );
CREATE POLICY job_skills_insert_own ON public.job_skills
  FOR INSERT WITH CHECK (public.company_owns_job(job_id));
CREATE POLICY job_skills_delete_own ON public.job_skills
  FOR DELETE USING (public.company_owns_job(job_id));

CREATE POLICY job_applications_admin_all ON public.job_applications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_applications_select_visible ON public.job_applications
  FOR SELECT USING (
    applicant_id = public.auth_user_id()
    OR public.company_owns_job(job_id)
  );
CREATE POLICY job_applications_insert_own ON public.job_applications
  FOR INSERT WITH CHECK (applicant_id = public.auth_user_id() AND public.is_member());
CREATE POLICY job_applications_update_company ON public.job_applications
  FOR UPDATE USING (public.company_owns_job(job_id))
  WITH CHECK (public.company_owns_job(job_id));
CREATE POLICY job_applications_withdraw_own ON public.job_applications
  FOR UPDATE USING (applicant_id = public.auth_user_id())
  WITH CHECK (applicant_id = public.auth_user_id() AND status = 'withdrawn');

CREATE POLICY application_status_history_admin_all ON public.application_status_history
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY application_status_history_select_visible ON public.application_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND (ja.applicant_id = public.auth_user_id()
              OR public.company_owns_job(ja.job_id))
    )
  );
CREATE POLICY application_status_history_insert_company ON public.application_status_history
  FOR INSERT WITH CHECK (public.company_owns_application(application_id));

CREATE POLICY interview_schedules_admin_all ON public.interview_schedules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY interview_schedules_select_visible ON public.interview_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND (ja.applicant_id = public.auth_user_id()
              OR public.company_owns_job(ja.job_id))
    )
  );
CREATE POLICY interview_schedules_insert_company ON public.interview_schedules
  FOR INSERT WITH CHECK (public.company_owns_application(application_id));
CREATE POLICY interview_schedules_update_company ON public.interview_schedules
  FOR UPDATE USING (public.company_owns_application(application_id))
  WITH CHECK (public.company_owns_application(application_id));
CREATE POLICY interview_schedules_update_applicant_response ON public.interview_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND ja.applicant_id = public.auth_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND ja.applicant_id = public.auth_user_id()
    )
  );

CREATE POLICY saved_jobs_admin_all ON public.saved_jobs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY saved_jobs_select_own ON public.saved_jobs
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY saved_jobs_insert_own ON public.saved_jobs
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY saved_jobs_delete_own ON public.saved_jobs
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY job_alerts_admin_all ON public.job_alerts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_alerts_select_own ON public.job_alerts
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY job_alerts_insert_own ON public.job_alerts
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY job_alerts_update_own ON public.job_alerts
  FOR UPDATE USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY job_alerts_delete_own ON public.job_alerts
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY job_view_logs_admin_all ON public.job_view_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_view_logs_insert_viewer ON public.job_view_logs
  FOR INSERT WITH CHECK (viewer_user_id IS NULL OR viewer_user_id = public.auth_user_id());
CREATE POLICY job_view_logs_select_company ON public.job_view_logs
  FOR SELECT USING (public.company_owns_job(job_id));

CREATE POLICY conversations_admin_all ON public.conversations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY conversations_select_participant ON public.conversations
  FOR SELECT USING (public.is_my_conversation(id));
CREATE POLICY conversations_insert_authenticated ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (public.auth_user_id() IS NOT NULL);
CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE USING (public.is_my_conversation(id)) WITH CHECK (public.is_my_conversation(id));

CREATE POLICY conversation_participants_admin_all ON public.conversation_participants
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY conversation_participants_select ON public.conversation_participants
  FOR SELECT USING (public.is_my_conversation(conversation_id));
CREATE POLICY conversation_participants_insert_own ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY conversation_participants_update_own ON public.conversation_participants
  FOR UPDATE USING (user_id = public.auth_user_id()) WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY messages_admin_all ON public.messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY messages_select_participant ON public.messages
  FOR SELECT USING (public.is_my_conversation(conversation_id));
CREATE POLICY messages_insert_own ON public.messages
  FOR INSERT WITH CHECK (sender_id = public.auth_user_id() AND public.is_my_conversation(conversation_id));
CREATE POLICY messages_update_own ON public.messages
  FOR UPDATE USING (sender_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (sender_id = public.auth_user_id());
CREATE POLICY messages_update_read ON public.messages
  FOR UPDATE USING (public.is_my_conversation(conversation_id))
  WITH CHECK (public.is_my_conversation(conversation_id));

CREATE POLICY user_blocks_admin_all ON public.user_blocks
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY user_blocks_select_own ON public.user_blocks
  FOR SELECT USING (blocker_id = public.auth_user_id());
CREATE POLICY user_blocks_insert_own ON public.user_blocks
  FOR INSERT WITH CHECK (blocker_id = public.auth_user_id());
CREATE POLICY user_blocks_delete_own ON public.user_blocks
  FOR DELETE USING (blocker_id = public.auth_user_id());

CREATE POLICY notifications_admin_all ON public.notifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY notification_preferences_admin_all ON public.notification_preferences
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY notification_preferences_select_own ON public.notification_preferences
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());
CREATE POLICY notification_preferences_delete_own ON public.notification_preferences
  FOR DELETE USING (user_id = public.auth_user_id());

CREATE POLICY report_types_select_active ON public.report_types
  FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY report_types_admin_all ON public.report_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY reports_admin_all ON public.reports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY reports_select_own ON public.reports
  FOR SELECT USING (reporter_id = public.auth_user_id());
CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT WITH CHECK (reporter_id = public.auth_user_id());

CREATE POLICY moderation_actions_admin_all ON public.moderation_actions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY appeals_admin_all ON public.appeals
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY appeals_select_own ON public.appeals
  FOR SELECT USING (appellant_id = public.auth_user_id());
CREATE POLICY appeals_insert_own ON public.appeals
  FOR INSERT WITH CHECK (appellant_id = public.auth_user_id());

CREATE POLICY audit_logs_admin_all ON public.audit_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY system_settings_admin_all ON public.system_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY network_suggestions_admin_all ON public.network_suggestions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY network_suggestions_select_own ON public.network_suggestions
  FOR SELECT USING (user_id = public.auth_user_id());

CREATE POLICY user_feeds_admin_all ON public.user_feeds
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY user_feeds_select_own ON public.user_feeds
  FOR SELECT USING (user_id = public.auth_user_id());

CREATE POLICY provinces_select_all ON public.provinces FOR SELECT USING (TRUE);
CREATE POLICY provinces_admin_all ON public.provinces
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY wards_select_all ON public.wards FOR SELECT USING (TRUE);
CREATE POLICY wards_admin_all ON public.wards
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_types_select_all ON public.job_types FOR SELECT USING (TRUE);
CREATE POLICY job_types_admin_all ON public.job_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY work_modes_select_all ON public.work_modes FOR SELECT USING (TRUE);
CREATE POLICY work_modes_admin_all ON public.work_modes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_positions_select_all ON public.job_positions FOR SELECT USING (TRUE);
CREATE POLICY job_positions_admin_all ON public.job_positions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- END MIGRATION 20260619_052
-- =============================================================================
