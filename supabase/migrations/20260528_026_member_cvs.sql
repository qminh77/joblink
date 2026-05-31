-- =============================================================================
-- JOBLINK MIGRATION 20260528_026 — MEMBER CVs (upload & quản lý nhiều CV)
-- =============================================================================
-- Mục tiêu:
--   • SRS FR-M02-001 + UC-11 Easy Apply: Member upload PDF, đặt tên, set default,
--     chọn 1 CV khi apply job (thay vì paste URL ngoài như flow cũ).
--   • SRS Bảo mật: CV chứa PII — Company CHỈ được xem CV khi ứng viên đã apply.
--     Bucket `uploads` (post-media/avatar/cover) là PUBLIC → KHÔNG dùng được
--     cho CV vì bucket public override RLS, ai có URL cũng đọc được. Vì vậy
--     tách BUCKET PRIVATE riêng `cvs`, truy cập qua signed URL ttl ngắn.
--   • Bảng `member_cvs` lưu metadata; binary nằm ở `cvs/<userId>/<uuid>.pdf`.
-- =============================================================================

-- 1. Bảng member_cvs ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS member_cvs (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    file_name    VARCHAR(160) NOT NULL,            -- tên hiển thị do member đặt
    storage_path TEXT NOT NULL,                    -- path trong bucket `cvs`
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

ALTER TABLE member_cvs DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_member_cvs_user
    ON member_cvs(user_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_member_cvs_default_per_user
    ON member_cvs(user_id)
    WHERE is_default = TRUE AND deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_member_cvs_set_updated_at ON member_cvs;
CREATE TRIGGER trg_member_cvs_set_updated_at
BEFORE UPDATE ON member_cvs
FOR EACH ROW
EXECUTE FUNCTION joblink_set_updated_at();

-- 2. Bucket `cvs` PRIVATE (TÁCH KHỎI `uploads` để bảo mật) --------------------
-- `uploads` public → KHÔNG dùng cho CV. Bucket `cvs` private + signed URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cvs',
    'cvs',
    FALSE,                          -- PRIVATE
    5242880,                        -- 5MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
   SET public = EXCLUDED.public,
       file_size_limit = EXCLUDED.file_size_limit,
       allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. RLS bucket ----------------------------------------------------------------
-- Path: cvs/<userId>/<uuid>.pdf  (path_tokens[1] = userId)
-- KHÔNG có policy SELECT public — chỉ owner select. Member preview: client JWT
-- pass RLS (là owner). Company xem CV ứng viên: server action verify quyền
-- (jobs!inner ownership), rồi dùng `createAdminClient()` (service_role) để
-- sinh signed URL — service_role bypass RLS.

DROP POLICY IF EXISTS "cvs: authenticated insert own folder" ON storage.objects;
DROP POLICY IF EXISTS "cvs: owner select" ON storage.objects;
DROP POLICY IF EXISTS "cvs: owner delete" ON storage.objects;

CREATE POLICY "cvs: authenticated insert own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cvs'
    AND path_tokens[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cvs: owner select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND path_tokens[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cvs: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND path_tokens[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Lưu ý: nếu trước đó migration phiên bản cũ đã tạo bucket `cv` (2 ký tự),
-- KHÔNG thể DELETE bằng SQL — Supabase block `DELETE FROM storage.*` qua
-- trigger `storage.protect_delete`. Phải xóa qua Dashboard (Storage → Delete
-- bucket) hoặc Storage API. Bucket trùng tên cũ không ảnh hưởng chức năng:
-- code mới dùng bucket `cvs` (3 ký tự).

-- 4. RPC set default CV (atomic) -----------------------------------------------
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
