-- =============================================================================
-- JOBLINK MIGRATION 20260601_034 — NOTIFICATION PREFERENCES RLS  (UC-65)
-- =============================================================================
-- UC-65 (tùy chỉnh thông báo) là luồng GHI đầu tiên vào notification_preferences,
-- thực hiện bằng client RLS. Cần các policy own-row dưới đây:
--   • admin_all   : quản trị viên thao tác mọi dòng.
--   • select_own  : người dùng đọc cấu hình của chính mình.
--   • insert_own  : tạo cấu hình với user_id = chính mình.
--   • update_own  : cập nhật cấu hình của chính mình (dùng cho upsert).
--   • delete_own  : xoá cấu hình của chính mình.
-- Phụ thuộc helper public.auth_user_id() và public.is_admin() (đã có sẵn).
-- Idempotent: chạy lại không gây hại.
-- =============================================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.notification_preferences IS 'RLS: admin_all + owner only';

DROP POLICY IF EXISTS notification_preferences_admin_all ON public.notification_preferences;
CREATE POLICY notification_preferences_admin_all ON public.notification_preferences
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS notification_preferences_select_own ON public.notification_preferences;
CREATE POLICY notification_preferences_select_own ON public.notification_preferences
  FOR SELECT
  USING (user_id = public.auth_user_id());

DROP POLICY IF EXISTS notification_preferences_insert_own ON public.notification_preferences;
CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

DROP POLICY IF EXISTS notification_preferences_update_own ON public.notification_preferences;
CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

DROP POLICY IF EXISTS notification_preferences_delete_own ON public.notification_preferences;
CREATE POLICY notification_preferences_delete_own ON public.notification_preferences
  FOR DELETE
  USING (user_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260601_034
-- =============================================================================
