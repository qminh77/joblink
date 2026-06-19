import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

import { insertPollOptions, insertPost, updatePost } from "../data/posts.repo"
import { authorRefFrom, newFeedPost } from "../lib/map"
import { buildPollMedia } from "../lib/poll"
import type { PollInput, PostInput } from "../schemas"
import type { FeedPost } from "../types"
import { imageMedia } from "./post-media.service"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function createPollPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PollInput,
): Promise<FeedPost> {
  const row = unwrap(
    await insertPost(supabase, {
      authorId: current.appUser.id,
      content: data.content,
      postType: "poll",
      media: null,
      visibility: data.visibility,
    }),
    "createFailed",
  )

  const inserted = unwrap(
    await insertPollOptions(supabase, row.id, data.options),
    "createFailed",
  )

  const pollOptions = inserted.map((option) => ({
    id: option.id,
    optionText: option.option_text,
    voteCount: option.vote_count,
  }))

  const updated = unwrap(
    await updatePost(supabase, row.id, current.appUser.id, {
      content: row.content,
      visibility: row.visibility,
      media: buildPollMedia(pollOptions, 0),
    }),
    "createFailed",
  )

  return newFeedPost({
    id: row.id,
    authorId: current.appUser.id,
    content: row.content,
    postType: "poll",
    media: updated.media,
    visibility: row.visibility,
    createdAt: row.created_at,
    author: authorRefFrom(current),
    pollOptions: inserted.map((option) => ({
      id: option.id,
      optionText: option.option_text,
      voteCount: option.vote_count,
      viewerVoted: false,
    })),
  })
}

export async function createVideoPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PostInput,
  videoUrl: string,
): Promise<FeedPost> {
  const row = unwrap(
    await insertPost(supabase, {
      authorId: current.appUser.id,
      content: data.content,
      postType: "video",
      media: { type: "video", url: videoUrl } as unknown as Json,
      visibility: data.visibility,
    }),
    "createFailed",
  )

  return newFeedPost({
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    postType: row.post_type,
    media: row.media,
    visibility: row.visibility,
    createdAt: row.created_at,
    author: authorRefFrom(current),
  })
}

export async function createStandardPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PostInput,
): Promise<FeedPost> {
  const hasMedia = data.mediaItems.length > 0
  const row = unwrap(
    await insertPost(supabase, {
      authorId: current.appUser.id,
      content: data.content,
      postType: hasMedia ? "image" : "text",
      media: imageMedia(data.mediaItems),
      visibility: data.visibility,
    }),
    "createFailed",
  )

  return newFeedPost({
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    postType: row.post_type,
    media: row.media,
    visibility: row.visibility,
    createdAt: row.created_at,
    author: authorRefFrom(current),
  })
}
