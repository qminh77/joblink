-- =============================================================================
-- JOBLINK MIGRATION 20260528_026 — MEMBER CVs (upload & quản lý nhiều CV)
-- =============================================================================
-- Mục tiêu:
--   • SRS FR-M02-001 + UC-11 Easy Apply: Member upload PDF, đặt tên, set default,
--     chọn 1 CV khi apply job (thay vì paste URL ngoài như flow cũ).
--   • Bảng `member_cvs` lưu metadata; file binary lưu ở Storage bucket `cv`
--     PRIVATE, truy cập qua signed URL có hạn (SRS yêu cầu Company chỉ xem CV
--     khi ứng viên đã apply — kiểm soát bằng RPC get_company_applicants +
--     signed URL hết hạn).
--   • CV vẫn không có RLS ở bảng — app enforce ownership ở action/repo (đồng
--     bộ với member_profiles/exp/edu). Bucket có RLS để chặn truy cập file
--     trực tiếp từ client.
-- =============================================================================

-- 1. Bảng member_cvs ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_cvs (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    file_name    VARCHAR(160) NOT NULL,            -- tên hiển thị do member đặt
    storage_path TEXT NOT NULL,                    -- path trong bucket `cv`
    file_size    INT NOT NULL,                     -- byte
    mime_type    VARCHAR(80) NOT NULL DEFAULT 'application/pdf',
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,   -- 1 default per user
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ NULL,
    CONSTRAINT fk_member_cv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_member_cv_size CHECK (file_size > 0 AND file_size <= 5 * 1024 * 1024),
    CONSTRAINT chk_member_cv_mime CHECK (mime_type = 'application/pdf'),
    CONSTRAINT uk_member_cv_path UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_member_cvs_user
    ON member_cvs(user_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Đảm bảo: mỗi user chỉ có TỐI ĐA 1 CV default (chưa xóa).
CREATE UNIQUE INDEX IF NOT EXISTS uk_member_cvs_default_per_user
    ON member_cvs(user_id)
    WHERE is_default = TRUE AND deleted_at IS NULL;

-- Trigger set updated_at -------------------------------------------------------
CREATE TRIGGER trg_member_cvs_set_updated_at
BEFORE UPDATE ON member_cvs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 2. Bucket `cv` PRIVATE -------------------------------------------------------
-- Private vì CV chứa thông tin cá nhân — chỉ chủ + company nhận application
-- mới xem được (thông qua signed URL được sinh từ server, hết hạn).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cv',
    'cv',
    FALSE,
    5242880,                          -- 5MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
   SET public = EXCLUDED.public,
       file_size_limit = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLS bucket ----------------------------------------------------------------
-- Path: cv/<userId>/<uuid>.pdf
--   path_tokens[1] = '<userId>' (chỉ ghép owner — đơn giản, không cần prefix
--   member-cv vì bucket riêng).
-- Server action chạy bằng service_role => bypass RLS. Các policy này là lớp
-- phòng thủ cho trường hợp client gọi storage trực tiếp.

DROP POLICY IF EXISTS "cv: authenticated insert own folder" ON storage.objects;
DROP POLICY IF EXISTS "cv: owner select" ON storage.objects;
DROP POLICY IF EXISTS "cv: owner delete" ON storage.objects;

CREATE POLICY "cv: authenticated insert own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cv'
    AND path_tokens[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cv: owner select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cv'
    AND path_tokens[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cv: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cv'
    AND path_tokens[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- 4. RPC set default CV (atomic) -----------------------------------------------
-- Đặt 1 CV làm default: clear cờ default ở các CV khác của user trước, rồi set
-- target. Gom 1 transaction để tránh vi phạm unique index ở giữa.
CREATE OR REPLACE FUNCTION public.set_default_member_cv(p_cv_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_me        BIGINT;
    v_owner_id  BIGINT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    SELECT user_id INTO v_owner_id
      FROM public.member_cvs
     WHERE id = p_cv_id
       AND deleted_at IS NULL;

    IF v_owner_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;

    IF v_owner_id <> v_me THEN
        RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;

    UPDATE public.member_cvs
       SET is_default = FALSE
     WHERE user_id = v_me
       AND is_default = TRUE
       AND id <> p_cv_id;

    UPDATE public.member_cvs
       SET is_default = TRUE
     WHERE id = p_cv_id;

    RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_default_member_cv(BIGINT) TO authenticated;

-- 5. Đồng bộ schema.sql --------------------------------------------------------
-- Lưu ý: cập nhật `schema.sql` tay trong commit này để khớp đầy đủ.
