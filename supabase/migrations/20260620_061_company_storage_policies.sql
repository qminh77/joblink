-- Cập nhật storage policies cho company-upload (company-logo, company-cover)

-- Đảm bảo cột cover_url tồn tại (phòng trường hợp migration 060 chưa chạy)
ALTER TABLE company_profiles
  ADD COLUMN IF NOT EXISTS cover_url text;

-- Cập nhật storage policies để cho phép company upload
DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND path_tokens[1] IN ('post-media', 'member-avatar', 'member-cover', 'company-logo', 'company-cover')
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "uploads: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND path_tokens[1] IN ('post-media', 'member-avatar', 'member-cover', 'company-logo', 'company-cover')
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );
