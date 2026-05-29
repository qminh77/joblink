-- =============================================================================
-- JOBLINK MIGRATION 20260602_028 — UPDATE REPORT TYPES
-- =============================================================================
-- Thay thế danh sách loại báo cáo cũ bằng danh sách mới toàn diện hơn,
-- tối ưu cho thị trường tuyển dụng Việt Nam, chia thành 5 nhóm A–E.
-- =============================================================================

-- Xoá dữ liệu seed cũ (an toàn vì reports.reason là VARCHAR, không có FK)
DELETE FROM report_types;

-- Insert 18 loại báo cáo mới
INSERT INTO report_types (code, name, name_en, sort_order) VALUES
    -- Nhóm A — Job & Tuyển dụng (Ưu tiên cao nhất)
    ('job_scam',        'Lừa đảo việc làm / Scam tuyển dụng',                    'Job scam / Fake job offer',               10),
    ('misleading_job',  'Thông tin tuyển dụng sai lệch',                         'Misleading job details',                  20),
    ('discriminatory',  'Phân biệt đối xử trong tuyển dụng',                     'Discriminatory hiring practices',         30),
    ('spam_job',        'Tin tuyển dụng spam / Không phù hợp',                   'Spammy or irrelevant job posting',        40),

    -- Nhóm B — Uy tín & Danh tính
    ('fake_company',    'Công ty / Nhà tuyển dụng giả mạo',                      'Fake company or recruiter impersonation', 50),
    ('impersonation',   'Giả mạo danh tính cá nhân',                             'Impersonation of a real person',          60),
    ('fake_profile',    'Hồ sơ / Tài khoản giả',                                 'Fake profile or account',                 70),

    -- Nhóm C — Nội dung chung & An toàn
    ('spam',            'Spam / Quảng cáo không liên quan',                      'Spam or irrelevant promotion',            80),
    ('harassment',      'Quấy rối / Bắt nạt',                                     'Harassment or bullying',                   90),
    ('hate_speech',     'Ngôn từ thù địch / Kỳ thị',                             'Hate speech or discriminatory language',  100),
    ('unprofessional',  'Nội dung thiếu chuyên nghiệp',                          'Unprofessional or inappropriate content', 110),
    ('misinformation',  'Thông tin sai sự thật / Tin giả',                       'Misinformation or false claims',          120),

    -- Nhóm D — Pháp lý & Nghiêm trọng
    ('fraud',            'Lừa đảo / Scam (không liên quan việc làm)',             'Fraud or scam (non-job)',                 130),
    ('ip_violation',     'Vi phạm sở hữu trí tuệ',                                'Intellectual property violation',         140),
    ('privacy_violation','Vi phạm quyền riêng tư',                                'Privacy violation',                        150),
    ('violence',         'Bạo lực / Nội dung nguy hiểm',                          'Violence or dangerous content',            160),
    ('self_harm',        'Khuyến khích tự hại / Tự tử',                           'Self-harm or suicide promotion',           170),

    -- Nhóm E — Dự phòng
    ('other',            'Khác',                                                  'Other',                                    999)
ON CONFLICT (code) DO UPDATE SET
    name       = EXCLUDED.name,
    name_en    = EXCLUDED.name_en,
    sort_order = EXCLUDED.sort_order,
    is_active  = TRUE,
    updated_at = NOW();

-- =============================================================================
-- END MIGRATION 20260602_028
-- =============================================================================
