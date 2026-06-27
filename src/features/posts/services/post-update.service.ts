import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { assertOk, unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"
import type { Json, PostType, PostVisibility } from "@/types/database"

import { softDeletePost, updatePost } from "../data/posts.repo"
import type { PostUpdateInput } from "../schemas"
import type { UpdatePostResult } from "../types"
import { imageMedia } from "./post-media.service"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function updateStandardPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PostUpdateInput,
): Promise<UpdatePostResult> {
  const patch: {
    content: string
    visibility: PostVisibility
    media?: Json | null
    post_type?: PostType
  } = {
    content: data.content,
    visibility: data.visibility,
  }

  if (data.mediaItems !== undefined) {
    const hasMedia = data.mediaItems.length > 0
    patch.media = imageMedia(data.mediaItems)
    patch.post_type = hasMedia ? "image" : "text"
  }

  const row = unwrap(
    await updatePost(supabase, data.postId, current.appUser.id, patch),
    "updateFailed",
  )

  return {
    postId: row.id,
    content: row.content,
    visibility: row.visibility,
    media: row.media,
    postType: row.post_type,
    updatedAt: row.updated_at,
  }
}

export async function deleteOwnPost(
  supabase: Supabase,
  current: CurrentUser,
  postId: number,
): Promise<void> {
  assertOk(
    await softDeletePost(supabase, postId, current.appUser.id),
    "unexpected",
  )
}
