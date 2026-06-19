import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { ActionError, assertOk, unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"
import type { Json, PostType, PostVisibility } from "@/types/database"

import {
  findPollByPostId,
  replacePollOptions,
  softDeletePost,
  updatePost,
} from "../data/posts.repo"
import { buildPollMedia } from "../lib/poll"
import type { PostUpdateInput, UpdatePollInput } from "../schemas"
import type { UpdatePostResult } from "../types"
import { imageMedia } from "./post-media.service"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function updatePollPost(
  supabase: Supabase,
  current: CurrentUser,
  data: UpdatePollInput,
): Promise<UpdatePostResult> {
  const existingOptions = await findPollByPostId(supabase, data.postId)
  const incomingIds = new Set(
    data.options
      .map((option) => option.id)
      .filter((id): id is number => id != null),
  )
  for (const option of existingOptions) {
    if (option.vote_count > 0 && !incomingIds.has(option.id)) {
      throw ActionError.key("votedOptionRemoveBlocked")
    }
  }

  const updatedOptions = await replacePollOptions(
    supabase,
    data.postId,
    data.options,
  )
  const totalVotes = updatedOptions.reduce(
    (sum, option) => sum + option.vote_count,
    0,
  )
  const pollOptions = updatedOptions.map((option) => ({
    id: option.id,
    optionText: option.option_text,
    voteCount: option.vote_count,
  }))

  const row = unwrap(
    await updatePost(supabase, data.postId, current.appUser.id, {
      content: data.content,
      visibility: data.visibility,
      media: buildPollMedia(pollOptions, totalVotes),
    }),
    "updateFailed",
  )

  return {
    postId: row.id,
    content: row.content,
    visibility: row.visibility,
    media: row.media,
    postType: "poll",
    updatedAt: row.updated_at,
    pollOptions,
  }
}

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
