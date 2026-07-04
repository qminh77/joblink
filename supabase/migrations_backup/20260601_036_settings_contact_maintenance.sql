-- =============================================================================
-- JOBLINK MIGRATION 20260601_036 — SETTINGS: CONTACT + MAINTENANCE  (UC-95/UC-96)
-- =============================================================================
-- updateSystemSettings chỉ UPDATE giá trị theo setting_key (không upsert) nên
-- các khoá cấu hình mới phải tồn tại sẵn trong system_settings. Migration này
-- seed nhóm "contact" (thông tin liên hệ, UC-95) và "maintenance" (chế độ bảo
-- trì, UC-96). Idempotent: ON CONFLICT theo setting_key bỏ qua nếu đã có.
-- =============================================================================

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('contact_address',     'contact',     'null'::jsonb,  FALSE),
    ('contact_email',       'contact',     'null'::jsonb,  FALSE),
    ('contact_phone',       'contact',     'null'::jsonb,  FALSE),
    ('contact_content',     'contact',     'null'::jsonb,  FALSE),
    ('contact_map_url',     'contact',     'null'::jsonb,  FALSE),
    ('maintenance_mode',    'maintenance', 'false'::jsonb, FALSE),
    ('maintenance_message', 'maintenance',
        '"Hệ thống đang được bảo trì. Vui lòng quay lại sau ít phút."'::jsonb, FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- =============================================================================
-- END MIGRATION 20260601_036
-- =============================================================================
