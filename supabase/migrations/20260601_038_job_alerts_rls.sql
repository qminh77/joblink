-- =============================================================================
-- JOBLINK MIGRATION 20260601_038 — JOB ALERTS RLS  (UC-57/UC-58)
-- =============================================================================
-- UC-57/58 (tạo/xóa cảnh báo việc làm) là luồng GHI đầu tiên vào job_alerts,
-- thực hiện bằng client RLS. Cần policy own-CRUD dưới đây.
-- (Phần "thông báo khi có việc mới khớp filter" cần tác vụ nền/cron — chưa làm.)
-- Phụ thuộc helper public.auth_user_id() / public.is_admin() (đã có sẵn).
-- Idempotent.
-- =============================================================================

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.job_alerts IS 'RLS: admin_all + owner CRUD';

DROP POLICY IF EXISTS job_alerts_admin_all ON public.job_alerts;
CREATE POLICY job_alerts_admin_all ON public.job_alerts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS job_alerts_select_own ON public.job_alerts;
CREATE POLICY job_alerts_select_own ON public.job_alerts
  FOR SELECT
  USING (user_id = public.auth_user_id());

DROP POLICY IF EXISTS job_alerts_insert_own ON public.job_alerts;
CREATE POLICY job_alerts_insert_own ON public.job_alerts
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

DROP POLICY IF EXISTS job_alerts_update_own ON public.job_alerts;
CREATE POLICY job_alerts_update_own ON public.job_alerts
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

DROP POLICY IF EXISTS job_alerts_delete_own ON public.job_alerts;
CREATE POLICY job_alerts_delete_own ON public.job_alerts
  FOR DELETE
  USING (user_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260601_038
-- =============================================================================
