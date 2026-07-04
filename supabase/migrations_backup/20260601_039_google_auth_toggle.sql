-- =============================================================================
-- JOBLINK MIGRATION 20260601_039 — GOOGLE AUTH TOGGLE
-- =============================================================================
-- Seed cờ bật/tắt đăng nhập Google (đọc bởi trang đăng nhập để ẩn/hiện nút).
-- Mặc định TẮT để tránh hiển thị nút khi chưa cấu hình Google provider.
-- Idempotent.
-- =============================================================================

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('google_auth_enabled', 'security', 'false'::jsonb, FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- END MIGRATION 20260601_039
-- =============================================================================
