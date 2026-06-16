-- =============================================================================
-- JOBLINK MIGRATION 20260601_033 — USER BLOCKS RLS  (UC-46 / UC-47)
-- =============================================================================
-- Bảng user_blocks đã được các RPC nhắn tin (SECURITY DEFINER) đọc để chặn hội
-- thoại, nhưng chưa có policy cho luồng GHI từ client. UC-46/UC-47 (chặn / bỏ
-- chặn) ghi trực tiếp bằng client RLS nên cần các policy dưới đây:
--   • admin_all   : quản trị viên thao tác mọi dòng.
--   • select_own  : người dùng chỉ thấy block do CHÍNH MÌNH tạo (không lộ ai
--                   đang chặn mình — bảo vệ quyền riêng tư).
--   • insert_own  : chỉ tạo block với blocker_id = chính mình.
--   • delete_own  : chỉ gỡ block do chính mình tạo.
-- Phụ thuộc helper public.auth_user_id() và public.is_admin() (đã có sẵn).
-- Idempotent: chạy lại không gây hại.
-- =============================================================================

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.user_blocks IS 'RLS: admin_all + blocker only';

DROP POLICY IF EXISTS user_blocks_admin_all ON public.user_blocks;
CREATE POLICY user_blocks_admin_all ON public.user_blocks
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS user_blocks_select_own ON public.user_blocks;
CREATE POLICY user_blocks_select_own ON public.user_blocks
  FOR SELECT
  USING (blocker_id = public.auth_user_id());

DROP POLICY IF EXISTS user_blocks_insert_own ON public.user_blocks;
CREATE POLICY user_blocks_insert_own ON public.user_blocks
  FOR INSERT
  WITH CHECK (blocker_id = public.auth_user_id());

DROP POLICY IF EXISTS user_blocks_delete_own ON public.user_blocks;
CREATE POLICY user_blocks_delete_own ON public.user_blocks
  FOR DELETE
  USING (blocker_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260601_033
-- =============================================================================
