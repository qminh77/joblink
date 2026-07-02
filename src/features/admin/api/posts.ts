"use server"

// SRS UC Trace - M09 UC-64 Kiem duyet bai viet.
// Flow: /admin/posts -> posts panel -> admin post API -> posts moderation service/repo -> audit + revalidate.

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminAccess } from "./admin-guard"
import { revalidateAdminSection } from "./revalidation"
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
  await requireAdminAccess()
  const supabase = createAdminClient()
  return loadAdminPosts(supabase, params)
}

export async function applyPostAction(
  input: PostActionInput,
): Promise<AdminActionResult> {
  const parsed = postActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdminAccess()
  const supabase = createAdminClient()
  const result = await applyPostModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("posts")
  return result
}
