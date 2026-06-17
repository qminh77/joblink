-- =============================================================================
-- JOBLINK MIGRATION 20260601_041 — PASSKEY TOGGLE
-- =============================================================================
-- Cờ bật/tắt đăng nhập bằng Passkey (WebAuthn) trên trang đăng nhập và mục quản
-- lý passkey trong Cài đặt. Mặc định TẮT để tránh hiển thị khi Supabase project
-- chưa bật passkey. Idempotent.
-- =============================================================================

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('passkey_enabled', 'security', 'false'::jsonb, FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- END MIGRATION 20260601_041
-- =============================================================================
