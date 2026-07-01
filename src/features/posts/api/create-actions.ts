"use server"

import { writeAuditLog } from "@/lib/audit"
import { checkRateLimit } from "@/lib/action/rate-limit"
import type { ActionResult } from "@/lib/action/result"
import { action, parse } from "@/lib/action/server"
import { requirePermission } from "@/lib/rbac"
import { createClient } from "@/lib/supabase/server"

import { createPostInputSchema } from "../schemas"
import {
  createStandardPost,
  createVideoPost,
} from "../services/post-actions.service"
import type { CreatePostActionInput, FeedPost } from "../types"
import { revalidateHome } from "./revalidation"

export async function createPostAction(
  input: CreatePostActionInput,
): Promise<ActionResult<FeedPost>> {
  return action("posts.errors", async (t) => {
    const current = await requirePermission("posts.create")
    await checkRateLimit(current.appUser.id, "post", 5, 60) // 5 posts / 60s
    const supabase = await createClient()

    const videoUrl =
      typeof input.videoUrl === "string" && input.videoUrl.startsWith("http")
        ? input.videoUrl
        : null
    if (videoUrl) {
      const data = parse(createPostInputSchema(t), { ...input, mediaItems: [] })
      const post = await createVideoPost(supabase, current, data, videoUrl)
      await writeAuditLog({
        actorId: current.appUser.id,
        action: "post.create_video",
        entityType: "posts",
        entityId: post.id,
        newData: { postType: "video", visibility: data.visibility },
      })
      revalidateHome()
      return post
    }

    const data = parse(createPostInputSchema(t), input)
    const post = await createStandardPost(supabase, current, data)
    await writeAuditLog({
      actorId: current.appUser.id,
      action: "post.create",
      entityType: "posts",
      entityId: post.id,
      newData: { visibility: data.visibility },
    })
    revalidateHome()
    return post
  })
}
