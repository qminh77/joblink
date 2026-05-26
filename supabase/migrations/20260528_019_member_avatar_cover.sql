-- =============================================================================
-- JOBLINK MIGRATION 20260528_019 — Member avatar + cover upload
-- =============================================================================
-- Mục tiêu:
--   • Thêm cột cover_url cho member_profiles (ảnh bìa, kiểu LinkedIn).
--   • Cho phép authenticated upload vào hai prefix mới trên bucket `uploads`:
--       member-avatar/<YYYY>/<MM>/<userId>/<uuid>.<ext>
--       member-cover/<YYYY>/<MM>/<userId>/<uuid>.<ext>
--     (cùng cấu trúc với post-media — gom theo tháng để dễ dọn rác sau này.)
--   • Đồng bộ với migration 20260523_010: policy cũ chỉ cho path_tokens[1]='post-media',
--     ta phải DROP & CREATE lại với điều kiện ANY trong các prefix hợp lệ.
-- =============================================================================

-- 1. Schema -------------------------------------------------------------------
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT NULL;

COMMENT ON COLUMN public.member_profiles.cover_url IS
  'URL ảnh bìa hồ sơ thành viên (lưu trong storage bucket uploads, prefix member-cover/).';

-- 2. Storage RLS --------------------------------------------------------------
-- Drop policies cũ (chỉ whitelist post-media) rồi tạo lại với danh sách prefix.
DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND path_tokens[1] IN ('post-media', 'member-avatar', 'member-cover')
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "uploads: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND path_tokens[1] IN ('post-media', 'member-avatar', 'member-cover')
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );
