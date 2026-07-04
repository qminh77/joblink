-- 054_schema_rls_policy_sync
-- Keep live DB aligned with schema.sql after the full RLS audit.
-- - Split active company from verified company authorization.
-- - Require active users for user-owned writes.
-- - Restore counter triggers that schema consolidation missed.
-- - Restore migration-defined views/RPCs with RLS-safe security_invoker views.

BEGIN;

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
    SELECT 1
      FROM public.users u
     WHERE u.auth_id::text = auth.uid()::text
       AND u.role = 'admin'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

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

CREATE OR REPLACE FUNCTION public.is_verified_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_verified_company_user(public.auth_user_id());
$$;

CREATE OR REPLACE FUNCTION public.is_member()
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

CREATE OR REPLACE FUNCTION public.company_owns_job(p_job_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.jobs j
     WHERE j.id = p_job_id
       AND j.company_user_id = public.auth_user_id()
       AND j.deleted_at IS NULL
       AND public.is_verified_company()
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
       AND public.is_verified_company()
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_company() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_company_user(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_company() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_member() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_owns_job(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_owns_application(BIGINT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.connections_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'accepted' THEN
      UPDATE public.users
         SET connection_count = connection_count + 1
       WHERE id IN (NEW.requester_id, NEW.receiver_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
        UPDATE public.users
           SET connection_count = connection_count + 1
         WHERE id IN (NEW.requester_id, NEW.receiver_id);
      ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
        UPDATE public.users
           SET connection_count = GREATEST(0, connection_count - 1)
         WHERE id IN (OLD.requester_id, OLD.receiver_id);
      END IF;
    END IF;

    IF NEW.status = 'accepted'
       AND OLD.status = 'accepted'
       AND (OLD.requester_id, OLD.receiver_id)
           IS DISTINCT FROM (NEW.requester_id, NEW.receiver_id) THEN
      UPDATE public.users
         SET connection_count = GREATEST(0, connection_count - 1)
       WHERE id IN (OLD.requester_id, OLD.receiver_id);
      UPDATE public.users
         SET connection_count = connection_count + 1
       WHERE id IN (NEW.requester_id, NEW.receiver_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'accepted' THEN
      UPDATE public.users
         SET connection_count = GREATEST(0, connection_count - 1)
       WHERE id IN (OLD.requester_id, OLD.receiver_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.profile_view_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
       SET profile_view_count = profile_view_count + 1
     WHERE id = NEW.target_user_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.users
       SET profile_view_count = GREATEST(0, profile_view_count - 1)
     WHERE id = OLD.target_user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_connections_counter ON public.connections;
CREATE TRIGGER trg_connections_counter
  AFTER INSERT OR UPDATE OR DELETE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.connections_counter_trigger();

DROP TRIGGER IF EXISTS trg_profile_view_counter ON public.profile_view_logs;
CREATE TRIGGER trg_profile_view_counter
  AFTER INSERT OR DELETE ON public.profile_view_logs
  FOR EACH ROW EXECUTE FUNCTION public.profile_view_counter_trigger();

DROP TRIGGER IF EXISTS trg_wards_set_updated_at ON public.wards;
CREATE TRIGGER trg_wards_set_updated_at
  BEFORE UPDATE ON public.wards
  FOR EACH ROW EXECUTE FUNCTION public.joblink_set_updated_at();

DROP TRIGGER IF EXISTS trg_member_cvs_set_updated_at ON public.member_cvs;
CREATE TRIGGER trg_member_cvs_set_updated_at
  BEFORE UPDATE ON public.member_cvs
  FOR EACH ROW EXECUTE FUNCTION public.joblink_set_updated_at();

WITH conn_counts AS (
  SELECT u.id,
         (SELECT COUNT(*) FROM public.connections c
           WHERE c.status = 'accepted'
             AND (c.requester_id = u.id OR c.receiver_id = u.id)) AS cnt
    FROM public.users u
),
view_counts AS (
  SELECT u.id,
         (SELECT COUNT(*) FROM public.profile_view_logs v
           WHERE v.target_user_id = u.id) AS cnt
    FROM public.users u
)
UPDATE public.users u
   SET connection_count = cc.cnt,
       profile_view_count = vc.cnt
  FROM conn_counts cc, view_counts vc
 WHERE cc.id = u.id
   AND vc.id = u.id
   AND (u.connection_count <> cc.cnt OR u.profile_view_count <> vc.cnt);

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

CREATE OR REPLACE VIEW public.v_active_jobs
WITH (security_invoker = true) AS
SELECT j.*,
       cp.name AS company_name,
       cp.slug AS company_slug,
       cp.logo_url AS company_logo,
       p.name AS province_name,
       w.name AS ward_name,
       jt.code AS job_type_code,
       jt.name AS job_type_name,
       wm.code AS work_mode_code,
       wm.name AS work_mode_name,
       jp.name AS job_position_name
  FROM public.jobs j
  JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
  JOIN public.job_types jt ON jt.id = j.job_type_id
  JOIN public.work_modes wm ON wm.id = j.work_mode_id
  LEFT JOIN public.provinces p ON p.id = j.province_id
  LEFT JOIN public.wards w ON w.id = j.ward_id
  LEFT JOIN public.job_positions jp ON jp.id = j.job_position_id
 WHERE j.status = 'active'
   AND (j.expires_at IS NULL OR j.expires_at > NOW())
   AND j.deleted_at IS NULL
   AND cp.verification_status = 'verified';

CREATE OR REPLACE VIEW public.v_admin_audit_log
WITH (security_invoker = true) AS
SELECT a.id,
       a.actor_id,
       u.email AS actor_email,
       COALESCE(mp.full_name, cp.name, u.email) AS actor_name,
       a.action,
       a.entity_type,
       a.entity_id,
       a.old_data,
       a.new_data,
       a.reason,
       a.ip_address,
       a.user_agent,
       a.created_at
  FROM public.audit_logs a
  LEFT JOIN public.users u ON u.id = a.actor_id
  LEFT JOIN public.member_profiles mp ON mp.user_id = u.id AND mp.deleted_at IS NULL
  LEFT JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL;

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

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (id = public.auth_user_id() AND deleted_at IS NULL AND public.is_active_user())
  WITH CHECK (id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS member_profiles_update_own ON public.member_profiles;
DROP POLICY IF EXISTS member_profiles_delete_own ON public.member_profiles;
CREATE POLICY member_profiles_update_own ON public.member_profiles
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_profiles_delete_own ON public.member_profiles
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS member_experiences_insert_own ON public.member_experiences;
DROP POLICY IF EXISTS member_experiences_update_own ON public.member_experiences;
DROP POLICY IF EXISTS member_experiences_delete_own ON public.member_experiences;
CREATE POLICY member_experiences_insert_own ON public.member_experiences
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_experiences_update_own ON public.member_experiences
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_experiences_delete_own ON public.member_experiences
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS member_educations_insert_own ON public.member_educations;
DROP POLICY IF EXISTS member_educations_update_own ON public.member_educations;
DROP POLICY IF EXISTS member_educations_delete_own ON public.member_educations;
CREATE POLICY member_educations_insert_own ON public.member_educations
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_educations_update_own ON public.member_educations
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_educations_delete_own ON public.member_educations
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS skills_insert_authenticated ON public.skills;
CREATE POLICY skills_insert_authenticated ON public.skills
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());

DROP POLICY IF EXISTS member_skills_insert_own ON public.member_skills;
DROP POLICY IF EXISTS member_skills_update_own ON public.member_skills;
DROP POLICY IF EXISTS member_skills_delete_own ON public.member_skills;
CREATE POLICY member_skills_insert_own ON public.member_skills
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_skills_update_own ON public.member_skills
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_skills_delete_own ON public.member_skills
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS profile_view_logs_insert_viewer ON public.profile_view_logs;
CREATE POLICY profile_view_logs_insert_viewer ON public.profile_view_logs
  FOR INSERT WITH CHECK (viewer_user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS member_cvs_insert_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_update_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_delete_own ON public.member_cvs;
CREATE POLICY member_cvs_insert_own ON public.member_cvs
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_cvs_update_own ON public.member_cvs
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_cvs_delete_own ON public.member_cvs
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS company_profiles_insert_own ON public.company_profiles;
DROP POLICY IF EXISTS company_profiles_update_own ON public.company_profiles;
DROP POLICY IF EXISTS company_profiles_delete_own ON public.company_profiles;
CREATE POLICY company_profiles_insert_own ON public.company_profiles
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_company());
CREATE POLICY company_profiles_update_own ON public.company_profiles
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_company())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_company());
CREATE POLICY company_profiles_delete_own ON public.company_profiles
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_company());

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
DROP POLICY IF EXISTS posts_update_own ON public.posts;
DROP POLICY IF EXISTS posts_delete_own ON public.posts;
CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY posts_update_own ON public.posts
  FOR UPDATE USING (
    author_id = public.auth_user_id()
    AND deleted_at IS NULL
    AND public.is_active_user()
  )
  WITH CHECK (author_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY posts_delete_own ON public.posts
  FOR DELETE USING (author_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS poll_options_insert_own ON public.poll_options;
DROP POLICY IF EXISTS poll_options_update_own ON public.poll_options;
DROP POLICY IF EXISTS poll_options_delete_own ON public.poll_options;
CREATE POLICY poll_options_insert_own ON public.poll_options
  FOR INSERT WITH CHECK (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );
CREATE POLICY poll_options_update_own ON public.poll_options
  FOR UPDATE USING (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  )
  WITH CHECK (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );
CREATE POLICY poll_options_delete_own ON public.poll_options
  FOR DELETE USING (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );

DROP POLICY IF EXISTS poll_votes_insert_own ON public.poll_votes;
DROP POLICY IF EXISTS poll_votes_delete_own ON public.poll_votes;
CREATE POLICY poll_votes_insert_own ON public.poll_votes
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY poll_votes_delete_own ON public.poll_votes
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS post_reactions_insert_own ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_delete_own ON public.post_reactions;
CREATE POLICY post_reactions_insert_own ON public.post_reactions
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY post_reactions_delete_own ON public.post_reactions
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS post_comments_insert_own ON public.post_comments;
DROP POLICY IF EXISTS post_comments_update_own ON public.post_comments;
DROP POLICY IF EXISTS post_comments_delete_own ON public.post_comments;
CREATE POLICY post_comments_insert_own ON public.post_comments
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY post_comments_update_own ON public.post_comments
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY post_comments_delete_own ON public.post_comments
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS post_shares_insert_own ON public.post_shares;
DROP POLICY IF EXISTS post_shares_delete_own ON public.post_shares;
CREATE POLICY post_shares_insert_own ON public.post_shares
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY post_shares_delete_own ON public.post_shares
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS connections_insert_own ON public.connections;
DROP POLICY IF EXISTS connections_update_involved ON public.connections;
DROP POLICY IF EXISTS connections_delete_involved ON public.connections;
CREATE POLICY connections_insert_own ON public.connections
  FOR INSERT WITH CHECK (requester_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY connections_update_involved ON public.connections
  FOR UPDATE USING ((requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id()) AND public.is_active_user())
  WITH CHECK ((requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id()) AND public.is_active_user());
CREATE POLICY connections_delete_involved ON public.connections
  FOR DELETE USING ((requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id()) AND public.is_active_user());

DROP POLICY IF EXISTS follows_insert_own ON public.follows;
DROP POLICY IF EXISTS follows_delete_own ON public.follows;
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT WITH CHECK (follower_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE USING (follower_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS jobs_select_visible ON public.jobs;
DROP POLICY IF EXISTS jobs_insert_own ON public.jobs;
DROP POLICY IF EXISTS jobs_update_own ON public.jobs;
DROP POLICY IF EXISTS jobs_delete_own ON public.jobs;
CREATE POLICY jobs_select_visible ON public.jobs
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      (company_user_id = public.auth_user_id() AND public.is_verified_company())
      OR (
        status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND public.is_verified_company_user(company_user_id)
      )
    )
  );
CREATE POLICY jobs_insert_own ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (company_user_id = public.auth_user_id() AND public.is_verified_company());
CREATE POLICY jobs_update_own ON public.jobs
  FOR UPDATE USING (
    company_user_id = public.auth_user_id()
    AND deleted_at IS NULL
    AND public.is_verified_company()
  )
  WITH CHECK (company_user_id = public.auth_user_id() AND public.is_verified_company());
CREATE POLICY jobs_delete_own ON public.jobs
  FOR DELETE USING (company_user_id = public.auth_user_id() AND public.is_verified_company());

DROP POLICY IF EXISTS job_skills_select_visible ON public.job_skills;
CREATE POLICY job_skills_select_visible ON public.job_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1
        FROM public.jobs j
       WHERE j.id = job_id
         AND j.deleted_at IS NULL
         AND (
           public.company_owns_job(j.id)
           OR (
             j.status = 'active'
             AND (j.expires_at IS NULL OR j.expires_at > NOW())
             AND public.is_verified_company_user(j.company_user_id)
           )
         )
    )
  );

DROP POLICY IF EXISTS job_applications_withdraw_own ON public.job_applications;
CREATE POLICY job_applications_withdraw_own ON public.job_applications
  FOR UPDATE USING (applicant_id = public.auth_user_id() AND public.is_member())
  WITH CHECK (applicant_id = public.auth_user_id() AND public.is_member() AND status = 'withdrawn');

DROP POLICY IF EXISTS interview_schedules_update_applicant_response ON public.interview_schedules;
CREATE POLICY interview_schedules_update_applicant_response ON public.interview_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND ja.applicant_id = public.auth_user_id()
         AND public.is_member()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND ja.applicant_id = public.auth_user_id()
         AND public.is_member()
    )
  );

DROP POLICY IF EXISTS saved_jobs_insert_own ON public.saved_jobs;
DROP POLICY IF EXISTS saved_jobs_delete_own ON public.saved_jobs;
CREATE POLICY saved_jobs_insert_own ON public.saved_jobs
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY saved_jobs_delete_own ON public.saved_jobs
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS job_alerts_insert_own ON public.job_alerts;
DROP POLICY IF EXISTS job_alerts_update_own ON public.job_alerts;
DROP POLICY IF EXISTS job_alerts_delete_own ON public.job_alerts;
CREATE POLICY job_alerts_insert_own ON public.job_alerts
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY job_alerts_update_own ON public.job_alerts
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY job_alerts_delete_own ON public.job_alerts
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

DROP POLICY IF EXISTS job_view_logs_insert_viewer ON public.job_view_logs;
CREATE POLICY job_view_logs_insert_viewer ON public.job_view_logs
  FOR INSERT WITH CHECK (
    viewer_user_id IS NULL
    OR (viewer_user_id = public.auth_user_id() AND public.is_active_user())
  );

DROP POLICY IF EXISTS conversations_insert_authenticated ON public.conversations;
DROP POLICY IF EXISTS conversations_update_participant ON public.conversations;
CREATE POLICY conversations_insert_authenticated ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE USING (public.is_my_conversation(id) AND public.is_active_user())
  WITH CHECK (public.is_my_conversation(id) AND public.is_active_user());

DROP POLICY IF EXISTS conversation_participants_insert_own ON public.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_update_own ON public.conversation_participants;
CREATE POLICY conversation_participants_insert_own ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY conversation_participants_update_own ON public.conversation_participants
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
DROP POLICY IF EXISTS messages_update_own ON public.messages;
DROP POLICY IF EXISTS messages_update_read ON public.messages;
CREATE POLICY messages_insert_own ON public.messages
  FOR INSERT WITH CHECK (sender_id = public.auth_user_id() AND public.is_active_user() AND public.is_my_conversation(conversation_id));
CREATE POLICY messages_update_own ON public.messages
  FOR UPDATE USING (sender_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_active_user())
  WITH CHECK (sender_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY messages_update_read ON public.messages
  FOR UPDATE USING (public.is_my_conversation(conversation_id) AND public.is_active_user())
  WITH CHECK (public.is_my_conversation(conversation_id) AND public.is_active_user());

DROP POLICY IF EXISTS user_blocks_insert_own ON public.user_blocks;
DROP POLICY IF EXISTS user_blocks_delete_own ON public.user_blocks;
CREATE POLICY user_blocks_insert_own ON public.user_blocks
  FOR INSERT WITH CHECK (blocker_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY user_blocks_delete_own ON public.user_blocks
  FOR DELETE USING (blocker_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;
DROP POLICY IF EXISTS notification_preferences_delete_own ON public.notification_preferences;
CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY notification_preferences_delete_own ON public.notification_preferences
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS reports_insert_own ON public.reports;
CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT WITH CHECK (reporter_id = public.auth_user_id() AND public.is_active_user());

DROP POLICY IF EXISTS appeals_insert_own ON public.appeals;
CREATE POLICY appeals_insert_own ON public.appeals
  FOR INSERT WITH CHECK (appellant_id = public.auth_user_id() AND public.is_active_user());

COMMIT;
