-- =================================================================================
-- MIGRATION: RPC tối ưu hiệu suất Admin Panel
-- 1. count_applications_per_job: GROUP BY thay vì client-side counting
-- 2. get_distinct_audit_actions: DISTINCT thay vì tải 500 rows
-- =================================================================================

-- 1. Đếm số lượng application cho từng job — 1 query thay vì tải toàn bộ rows
CREATE OR REPLACE FUNCTION public.count_applications_per_job(p_job_ids BIGINT[])
RETURNS TABLE(job_id BIGINT, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ja.job_id, COUNT(*)::BIGINT
  FROM public.job_applications ja
  WHERE ja.job_id = ANY(p_job_ids)
  GROUP BY ja.job_id;
$$;

GRANT EXECUTE ON FUNCTION public.count_applications_per_job TO anon, authenticated;

-- 2. Lấy danh sách action riêng biệt từ audit_logs
CREATE OR REPLACE FUNCTION public.get_distinct_audit_actions()
RETURNS TABLE(action TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.action
  FROM public.audit_logs a
  ORDER BY a.action;
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_audit_actions TO anon, authenticated;
