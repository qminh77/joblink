import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json, PostType } from "@/types/database"
import type { UserRole } from "@/lib/constants"

import { readSharedOriginal } from "../lib/media"
import type { SharedOriginal } from "../lib/media"

// ⚠️ RANH GIỚI ĐẶC QUYỀN ⚠️
// Các hàm dưới đây dùng service-role (BỎ QUA RLS) một cách CÓ CHỦ ĐÍCH: để xác
// định tác giả bài/bình luận phục vụ NOTIFICATION bất kể viewer có quyền xem
// post hay không. Chỉ đọc tối thiểu (author id / snapshot) và KHÔNG nhận input
// chưa kiểm. Mọi nhu cầu service-role của posts phải nằm gọn trong file này để
// dễ audit — đừng rải `createAdminClient()` ra action.

export async function getPostAuthorId(postId: number): Promise<number | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle<{ author_id: number }>()
  return data?.author_id ?? null
}

export async function getCommentAuthorId(
  commentId: number,
): Promise<number | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("post_comments")
    .select("user_id")
    .eq("id", commentId)
    .is("deleted_at", null)
    .maybeSingle<{ user_id: number }>()
  return data?.user_id ?? null
}

/**
 * Dựng snapshot bài gốc để nhúng vào bài share. Nếu bài đang share vốn đã là 1
 * share khác thì "đào" snapshot gốc, tránh share-lồng-share.
 */
export async function loadOriginalSnapshot(
  postId: number,
): Promise<SharedOriginal | null> {
  const admin = createAdminClient()
  const { data: row } = await admin
    .from("posts")
    .select("id, author_id, content, post_type, media, created_at")
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle<{
      id: number
      author_id: number
      content: string
      post_type: PostType
      media: Json | null
      created_at: string
    }>()

  if (!row) return null

  const nested = readSharedOriginal(row.media)
  if (nested) return nested

  const [userRes, memberRes, companyRes] = await Promise.all([
    admin
      .from("users")
      .select("id, role")
      .eq("id", row.author_id)
      .maybeSingle<{ id: number; role: UserRole }>(),
    admin
      .from("member_profiles")
      .select("full_name, avatar_url, headline")
      .eq("user_id", row.author_id)
      .is("deleted_at", null)
      .maybeSingle<{
        full_name: string | null
        avatar_url: string | null
        headline: string | null
      }>(),
    admin
      .from("company_profiles")
      .select("name, logo_url, industry")
      .eq("user_id", row.author_id)
      .is("deleted_at", null)
      .maybeSingle<{
        name: string | null
        logo_url: string | null
        industry: string | null
      }>(),
  ])

  const role: UserRole = userRes.data?.role ?? "member"
  const displayName =
    role === "company"
      ? companyRes.data?.name ?? memberRes.data?.full_name ?? "JobLink"
      : memberRes.data?.full_name ?? companyRes.data?.name ?? "JobLink"
  const avatarUrl =
    role === "company"
      ? companyRes.data?.logo_url ?? memberRes.data?.avatar_url ?? null
      : memberRes.data?.avatar_url ?? companyRes.data?.logo_url ?? null
  const headline =
    role === "company"
      ? companyRes.data?.industry ?? memberRes.data?.headline ?? null
      : memberRes.data?.headline ?? companyRes.data?.industry ?? null

  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    postType: row.post_type,
    media: row.media,
    createdAt: row.created_at,
    author: { userId: row.author_id, role, displayName, avatarUrl, headline },
  }
}
