"use server"

import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit } from "@/lib/action/rate-limit"
import type { ActionResult } from "@/lib/action/result"
import { action, parse } from "@/lib/action/server"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import { createPostIdSchema, createPostUpdateSchema } from "../schemas"
import {
  deleteOwnPost,
  updateStandardPost,
} from "../services/post-actions.service"
import type { UpdatePostActionInput, UpdatePostResult } from "../types"
import { revalidateHome } from "./revalidation"

export async function updatePostAction(
  input: UpdatePostActionInput,
): Promise<ActionResult<UpdatePostResult>> {
  return action("posts.errors", async (t) => {
    const current = await requirePermission("posts.edit")
    await checkRateLimit(current.appUser.id, "post", 10, 60) // 10 updates / 60s
    const supabase = await createClient()

    const data = parse(createPostUpdateSchema(t), input)
    const result = await updateStandardPost(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.update",
      entityType: "posts",
      entityId: input.postId,
      newData: { visibility: data.visibility },
    })
    revalidateHome()
    return result
  })
}

export async function deletePostAction(postId: number): Promise<ActionResult> {
  return action("posts.errors", async (t) => {
    const id = parse(createPostIdSchema(t), postId)
    const current = await requirePermission("posts.delete")
    await checkRateLimit(current.appUser.id, "post", 10, 60) // 10 deletes / 60s
    const supabase = await createClient()
    await deleteOwnPost(supabase, current, id)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.delete",
      entityType: "posts",
      entityId: id,
    })
    revalidateHome()
  })
}
