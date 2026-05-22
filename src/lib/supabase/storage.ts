export function getPostImagePath(url: string): string | null {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/post-media/`
  if (!url.startsWith(prefix)) return null
  return url.slice(prefix.length)
}
