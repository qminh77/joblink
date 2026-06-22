"use server"

import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

export type PostPreviewData = {
  id: number
  authorId: number
  authorName: string
  authorAvatarUrl: string | null
  content: string
  media: Json | null
  createdAt: string
} | null

/**
 * Lấy dữ liệu tóm tắt của 1 bài viết để hiển thị preview trong message.
 * Nhẹ hơn loadSinglePost — chỉ lấy các field cần cho preview card.
 */
export async function getPostPreviewAction(
  postId: number,
): Promise<PostPreviewData> {
  const supabase = await createClient()

  const { data: post } = await supabase
    .from("posts")
    .select("id, author_id, content, media, created_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .eq("status", "active")
    .maybeSingle<{
      id: number
      author_id: number
      content: string
      media: unknown
      created_at: string
    }>()

  if (!post) return null

  const [memberRes, companyRes] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("user_id, full_name, avatar_url")
      .eq("user_id", post.author_id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("company_profiles")
      .select("user_id, name, logo_url")
      .eq("user_id", post.author_id)
      .is("deleted_at", null)
      .maybeSingle(),
  ])

  const member = memberRes.data
  const company = companyRes.data
  const authorName = member?.full_name ?? company?.name ?? "JobLink"
  const authorAvatarUrl = member?.avatar_url ?? company?.logo_url ?? null

  return {
    id: post.id,
    authorId: post.author_id,
    authorName,
    authorAvatarUrl,
    content: post.content,
    media: post.media as Json,
    createdAt: post.created_at,
  }
}
