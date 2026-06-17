-- =============================================================================
-- JOBLINK MIGRATION 20260601_040 — REQUIRE EMAIL VERIFICATION TOGGLE
-- =============================================================================
-- Cờ bật/tắt yêu cầu xác minh email khi đăng ký.
--   • true  (mặc định): tài khoản tạo ở trạng thái chưa xác minh, phải bấm link
--     trong email (gửi qua SMTP) mới kích hoạt — giữ nguyên hành vi hiện tại.
--   • false: tài khoản được tạo đã xác minh sẵn (email_confirm), đăng nhập ngay.
-- Idempotent.
-- =============================================================================

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('require_email_verification', 'security', 'true'::jsonb, FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- END MIGRATION 20260601_040
-- =============================================================================
