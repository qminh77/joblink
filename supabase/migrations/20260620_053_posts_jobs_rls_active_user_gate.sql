-- 053_posts_jobs_rls_active_user_gate
-- Fix live RLS drift around post/job writes and enforce company approval.
-- - posts writes require the authenticated app user to be active.
-- - company job writes require an active company account.

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
      JOIN public.company_profiles cp ON cp.user_id = u.id
     WHERE u.id = public.auth_user_id()
       AND u.role = 'company'
       AND u.status = 'active'
       AND cp.verification_status = 'verified'
       AND cp.deleted_at IS NULL
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_company() TO anon, authenticated;

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_insert_own ON public.posts;
DROP POLICY IF EXISTS posts_update_own ON public.posts;
DROP POLICY IF EXISTS posts_delete_own ON public.posts;

CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = public.auth_user_id()
    AND public.is_active_user()
  );

CREATE POLICY posts_update_own ON public.posts
  FOR UPDATE USING (
    author_id = public.auth_user_id()
    AND deleted_at IS NULL
    AND public.is_active_user()
  )
  WITH CHECK (
    author_id = public.auth_user_id()
    AND public.is_active_user()
  );

CREATE POLICY posts_delete_own ON public.posts
  FOR DELETE USING (
    author_id = public.auth_user_id()
    AND public.is_active_user()
  );

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_insert_own ON public.jobs;
DROP POLICY IF EXISTS jobs_update_own ON public.jobs;
DROP POLICY IF EXISTS jobs_delete_own ON public.jobs;

CREATE POLICY jobs_insert_own ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    company_user_id = public.auth_user_id()
    AND public.is_company()
  );

CREATE POLICY jobs_update_own ON public.jobs
  FOR UPDATE USING (
    company_user_id = public.auth_user_id()
    AND deleted_at IS NULL
    AND public.is_company()
  )
  WITH CHECK (
    company_user_id = public.auth_user_id()
    AND public.is_company()
  );

CREATE POLICY jobs_delete_own ON public.jobs
  FOR DELETE USING (
    company_user_id = public.auth_user_id()
    AND public.is_company()
  );

COMMIT;
