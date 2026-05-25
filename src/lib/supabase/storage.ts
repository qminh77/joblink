const STORAGE_PUBLIC_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public`

// Path mới trong bucket `uploads`:
//   uploads/post-media/<YYYY>/<MM>/<userId>/<uuid>.<ext>
// Path cũ (bucket `post-media`) vẫn được nhận diện để xoá hoặc đọc ngược.
export function getPostImagePath(
  url: string,
): { bucket: string; path: string } | null {
  const newPrefix = `${STORAGE_PUBLIC_BASE}/uploads/`
  if (url.startsWith(newPrefix)) {
    return { bucket: "uploads", path: url.slice(newPrefix.length) }
  }
  const legacyPrefix = `${STORAGE_PUBLIC_BASE}/post-media/`
  if (url.startsWith(legacyPrefix)) {
    return { bucket: "post-media", path: url.slice(legacyPrefix.length) }
  }
  return null
}
