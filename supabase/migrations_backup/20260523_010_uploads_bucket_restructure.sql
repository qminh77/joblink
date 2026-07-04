-- =============================================================================
-- Storage: tách sang bucket `uploads` với layout phân tầng theo thời gian / user
-- Path mới:  uploads/post-media/<YYYY>/<MM>/<userId>/<uuid>.<ext>
-- Giữ bucket `post-media` cũ để URL ảnh đã đăng vẫn truy cập được (read-only).
-- =============================================================================

-- 1. Bucket --------------------------------------------------------------------
-- ON CONFLICT DO UPDATE: nếu bucket đã tồn tại (vd: bị tạo nháp qua dashboard
-- với public=false), migration vẫn ép về đúng cấu hình. Đây là nguyên nhân
-- phổ biến gây lỗi "khung ảnh trống" — bucket private khiến URL public 400.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies --------------------------------------------------------------
-- Authenticated user chỉ được ghi vào folder của chính mình:
--   post-media/<YYYY>/<MM>/<userId>/...
-- => path_tokens[1]='post-media' AND path_tokens[4] = id user trong public.users
--    (khớp với requireCurrentUser(): public.users.auth_id = auth.uid()).
-- Lưu ý: server actions chạy bằng service_role nên bypass RLS — các policy
-- này là lớp phòng thủ cho trường hợp client gọi storage trực tiếp.

DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: public read" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND path_tokens[1] = 'post-media'
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "uploads: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'uploads');

CREATE POLICY "uploads: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- 3. Index --------------------------------------------------------------------
-- KHÔNG CREATE INDEX ON storage.objects ở đây: trên Supabase managed, role
-- `postgres` không sở hữu storage.objects (thuộc `supabase_storage_admin`),
-- nên CREATE INDEX sẽ lỗi "must be owner of table objects".
--
-- Truy vấn theo prefix path (`name LIKE 'post-media/2026/05/<userId>/%'`) vẫn
-- nhanh nhờ các index mặc định Supabase đã tạo sẵn trên storage.objects:
--   * UNIQUE (bucket_id, name)         -- bucketid_objname
--   * (name text_pattern_ops)          -- name_prefix_search  -> prefix LIKE
--   * GIN (path_tokens)                -- tìm theo từng tầng folder
--
-- Nếu sau này thực sự cần partial index riêng cho bucket `uploads`, tạo qua
-- Supabase dashboard (chạy với quyền supabase_storage_admin) thay vì migration.
