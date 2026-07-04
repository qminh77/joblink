-- =============================================================================
-- JOBLINK MIGRATION 20260528_028 — Tắt RLS cho recruitment tables (defensive)
-- =============================================================================
-- Lỗi gặp ở user: `infinite recursion detected in policy for relation
-- "job_applications"`. Project pattern là KHÔNG bật RLS ở core/recruitment
-- tables — RPC SECURITY INVOKER + check business logic. Supabase Dashboard
-- thường tự bật RLS khi user tạo/sửa table qua UI → cần explicit DISABLE.
-- Áp idempotent cho mọi recruitment table phòng trường hợp đã bị bật.
-- =============================================================================

ALTER TABLE IF EXISTS public.jobs                       DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_applications           DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.interview_schedules        DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.saved_jobs                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_skills                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_view_logs              DISABLE ROW LEVEL SECURITY;

-- Drop bất kỳ policy nào còn lại có thể đã gây recursion. DROP POLICY IF EXISTS
-- KHÔNG ném lỗi nếu policy không có; an toàn để chạy.
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT polname AS policyname, polrelid::regclass::text AS tbl
          FROM pg_policy
         WHERE polrelid::regclass::text IN (
             'public.job_applications',
             'public.application_status_history',
             'public.interview_schedules',
             'public.saved_jobs',
             'public.job_skills',
             'public.job_view_logs'
         )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %s', r.policyname, r.tbl);
    END LOOP;
END $$;
