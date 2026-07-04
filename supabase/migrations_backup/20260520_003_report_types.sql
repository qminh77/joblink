-- =============================================================================
-- JOBLINK MIGRATION 20260520_003 — REPORT TYPES (LOẠI BÁO CÁO)
-- =============================================================================
-- Bảng lookup cho lý do báo cáo (report reason categories).
-- Admin quản lý CRUD; UI hiển thị dropdown khi user báo cáo bài viết/công việc/...
-- =============================================================================

CREATE TABLE IF NOT EXISTS report_types (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(60)  NOT NULL,
    name        VARCHAR(160) NOT NULL,
    name_en     VARCHAR(160) NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_report_types_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_report_types_active
    ON report_types(is_active, sort_order);

-- Seed mặc định
INSERT INTO report_types (code, name, name_en, sort_order) VALUES
    ('spam',             'Spam / Quảng cáo',              'Spam / Advertising',              1),
    ('harassment',       'Quấy rối / Bắt nạt',            'Harassment / Bullying',           2),
    ('misinformation',   'Tin giả / Sai sự thật',          'Misinformation / False news',      3),
    ('inappropriate',    'Nội dung không phù hợp',         'Inappropriate content',            4),
    ('violence',         'Bạo lực / Nguy hiểm',           'Violence / Dangerous content',      5),
    ('hate_speech',      'Ngôn từ thù địch',              'Hate speech',                      6),
    ('impersonation',    'Giả mạo danh tính',             'Impersonation',                    7),
    ('copyright',        'Vi phạm bản quyền',              'Copyright violation',              8),
    ('fraud',            'Lừa đảo',                       'Fraud / Scam',                     9),
    ('other',            'Khác',                          'Other',                            10)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- END MIGRATION 20260520_003
-- =============================================================================
