-- =============================================================================
-- Storage bucket cho post media
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "authenticated users can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "everyone can view"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-media');

CREATE POLICY "owner can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND owner_id = auth.uid());
