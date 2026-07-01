"use server"

import { createAdminClient } from "@/lib/supabase/admin"

import { requireAdminPermission } from "./admin-guard"
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
  await requireAdminPermission("posts.view")
  const supabase = createAdminClient()
  return loadAdminPosts(supabase, params)
}

export async function applyPostAction(
  input: PostActionInput,
): Promise<AdminActionResult> {
  const parsed = postActionSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }

  const current = await requireAdminPermission("posts.moderate")
  const supabase = createAdminClient()
  const result = await applyPostModerationAction(
    supabase,
    current,
    parsed.data,
  )

  if (result.ok) revalidateAdminSection("posts")
  return result
}
