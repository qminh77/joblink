-- =============================================================================
-- JOBLINK MIGRATION 20260601_035 — APPEALS USER RLS  (UC-71)
-- =============================================================================
-- Phía admin xử lý khiếu nại bằng service-role (bỏ qua RLS). UC-71 là luồng
-- NGƯỜI DÙNG đầu tiên đọc/ghi appeals bằng client RLS, cần:
--   • admin_all   : quản trị viên thao tác mọi đơn.
--   • select_own  : người dùng xem đơn của chính mình (appellant_id = mình).
--   • insert_own  : người dùng gửi đơn với appellant_id = chính mình.
-- moderation_actions vẫn admin-only (user-side đọc qua service-role có kiểm
-- soát ở appeals.privileged.ts) nên KHÔNG mở thêm policy ở đây.
-- Phụ thuộc helper public.auth_user_id() / public.is_admin() (đã có sẵn).
-- Idempotent.
-- =============================================================================

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.appeals IS 'RLS: admin_all + appellant only';

DROP POLICY IF EXISTS appeals_admin_all ON public.appeals;
CREATE POLICY appeals_admin_all ON public.appeals
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS appeals_select_own ON public.appeals;
CREATE POLICY appeals_select_own ON public.appeals
  FOR SELECT
  USING (appellant_id = public.auth_user_id());

DROP POLICY IF EXISTS appeals_insert_own ON public.appeals;
CREATE POLICY appeals_insert_own ON public.appeals
  FOR INSERT
  WITH CHECK (appellant_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260601_035
-- =============================================================================
