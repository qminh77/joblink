"use server"

// SRS UC Trace - M09 UC-64 Kiem duyet bai viet.
// Flow: /admin/posts -> posts panel -> admin post API -> posts moderation service/repo -> audit + revalidate.

import {
  requireAdminClient,
  requireAdminContext,
} from "../services/admin-context.service"
import { revalidateAdminSection } from "../services/admin-revalidation.service"
import { postActionSchema, type PostActionInput } from "../schemas"
import {
  applyPostModerationAction,
  loadAdminPosts,
} from "../services/posts.service"
import type { AdminActionResult, AdminPostRow, ListPostsParams } from "../types"

export type { AdminPostRow, ListPostsParams } from "../types"

export async function listAdminPosts(
  params: ListPostsParams = {},
): Promise<AdminPostRow[]> {
  const supabase = await requireAdminClient()
  return loadAdminPosts(supabase, params)
}

export async function applyPostAction(
  input: PostActionInput,
): Promise<AdminActionResult> {
  const parsed = postActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const { current, supabase } = await requireAdminContext()
  const result = await applyPostModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("posts")
  return result
}
