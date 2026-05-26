-- =============================================================================
-- Admin module — single-roundtrip dashboard RPC
-- Idempotent. Re-runnable safely.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_caller_role TEXT;
    v_seven_days  TIMESTAMPTZ := NOW() - INTERVAL '7 days';
    v_stats       JSONB;
    v_role_dist   JSONB;
    v_status_dist JSONB;
    v_verif_dist  JSONB;
    v_recent_acts JSONB;
BEGIN
    SELECT u.role INTO v_caller_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'totalUsers',         (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL),
        'newUsers7d',         (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL AND created_at >= v_seven_days),
        'totalCompanies',     (SELECT COUNT(*)::INT FROM public.users WHERE role = 'company' AND deleted_at IS NULL),
        'pendingCompanies',   (SELECT COUNT(*)::INT FROM public.company_profiles WHERE verification_status IN ('pending','pending_update') AND deleted_at IS NULL),
        'totalJobs',          (SELECT COUNT(*)::INT FROM public.jobs WHERE deleted_at IS NULL),
        'activeJobs',         (SELECT COUNT(*)::INT FROM public.jobs WHERE status = 'active' AND deleted_at IS NULL),
        'totalApplications',  (SELECT COUNT(*)::INT FROM public.job_applications),
        'pendingReports',     (SELECT COUNT(*)::INT FROM public.reports WHERE status IN ('pending','in_review')),
        'totalPosts',         (SELECT COUNT(*)::INT FROM public.posts WHERE deleted_at IS NULL AND status = 'active'),
        'totalConnections',   (SELECT COUNT(*)::INT FROM public.connections WHERE status = 'accepted')
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
                 a.entity_id   AS "entityId",
                 a.reason,
                 a.created_at  AS "createdAt",
                 jsonb_build_object(
                     'id',          au.id,
                     'email',       au.email,
                     'displayName', COALESCE(mp.full_name, cp.name, au.email)
                 ) AS actor
            FROM public.audit_logs a
            LEFT JOIN public.users au           ON au.id = a.actor_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = au.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = au.id AND cp.deleted_at IS NULL
           ORDER BY a.created_at DESC
           LIMIT 10
      ) x;

    RETURN jsonb_build_object(
        'stats',          v_stats,
        'roleDist',       v_role_dist,
        'statusDist',     v_status_dist,
        'verificationDist', v_verif_dist,
        'recentActions',  v_recent_acts
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO authenticated;

-- Optional convenience view: most-recent audit log entries with actor name
CREATE OR REPLACE VIEW public.v_admin_audit_log AS
SELECT a.id,
       a.actor_id,
       au.email AS actor_email,
       COALESCE(mp.full_name, cp.name, au.email) AS actor_name,
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
LEFT JOIN public.users au            ON au.id = a.actor_id
LEFT JOIN public.member_profiles mp  ON mp.user_id = au.id AND mp.deleted_at IS NULL
LEFT JOIN public.company_profiles cp ON cp.user_id = au.id AND cp.deleted_at IS NULL;
