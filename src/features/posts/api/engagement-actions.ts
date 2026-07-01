"use server"

import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit } from "@/lib/action/rate-limit"
import type { ActionResult } from "@/lib/action/result"
import { action, parse } from "@/lib/action/server"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import {
  createCommentIdSchema,
  createCommentInputSchema,
  createReactionInputSchema,
  createShareInputSchema,
} from "../schemas"
import {
  createPostComment,
  deletePostComment,
  shareFeedPost,
  togglePostReaction,
} from "../services/post-actions.service"
import type {
  CreateCommentActionInput,
  CreateCommentResult,
  DeleteCommentResult,
  SharePostActionInput,
  SharePostResult,
  ToggleReactionResult,
} from "../types"
import { revalidateHome } from "./revalidation"

export async function toggleReactionAction(
  postId: number,
): Promise<ActionResult<ToggleReactionResult>> {
  return action("posts.errors", async (t) => {
    const current = await requirePermission("posts.react")
    const data = parse(createReactionInputSchema(t), {
      postId,
      reactionType: "like",
    })
    await checkRateLimit(current.appUser.id, "reaction", 30, 60) // 30 reactions / 60s
    const supabase = await createClient()
    const result = await togglePostReaction(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: result.reacted ? "post.reaction_add" : "post.reaction_remove",
      entityType: "post_reactions",
      entityId: postId,
    })
    return result
  })
}

export async function createCommentAction(
  input: CreateCommentActionInput,
): Promise<ActionResult<CreateCommentResult>> {
  return action("posts.errors", async (t) => {
    const current = await requirePermission("posts.comment")
    const data = parse(createCommentInputSchema(t), input)
    await checkRateLimit(current.appUser.id, "comment", 15, 60) // 15 comments / 60s
    const supabase = await createClient()
    const result = await createPostComment(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.comment_add",
      entityType: "post_comments",
      entityId: data.postId,
      newData: { content: data.content.substring(0, 200) },
    })
    return result
  })
}

export async function deleteCommentAction(
  commentId: number,
): Promise<ActionResult<DeleteCommentResult>> {
  return action("posts.errors", async (t) => {
    const id = parse(createCommentIdSchema(t), commentId)
    const current = await requirePermission("posts.delete")
    const supabase = await createClient()
    const result = await deletePostComment(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.comment_delete",
      entityType: "post_comments",
      entityId: id,
    })
    return result
  })
}

export async function sharePostAction(
  input: SharePostActionInput,
): Promise<ActionResult<SharePostResult>> {
  return action("posts.errors", async (t) => {
    const data = parse(createShareInputSchema(t), input)
    const current = await requirePermission("posts.share")
    await checkRateLimit(current.appUser.id, "share", 10, 60) // 10 shares / 60s
    const supabase = await createClient()
    const result = await shareFeedPost(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.share",
      entityType: "post_shares",
      entityId: data.postId,
    })
    revalidateHome()
    return result
  })
}
