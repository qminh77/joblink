import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { unwrap } from "@/lib/action/server"
import type { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

import { createPollPostRpc, insertPost } from "../data/posts.repo"
import { authorRefFrom, newFeedPost } from "../lib/map"
import type { PollInput, PostInput } from "../schemas"
import type { FeedPost } from "../types"
import { imageMedia } from "./post-media.service"

type Supabase = Awaited<ReturnType<typeof createClient>>

export async function createPollPost(
  supabase: Supabase,
  current: CurrentUser,
  data: PollInput,
): Promise<FeedPost> {
  const result = unwrap(
    await createPollPostRpc(supabase, {
      content: data.content,
      visibility: data.visibility,
      options: data.options,
    }),
    "createFailed",
  )

  return newFeedPost({
    id: result.postId,
    authorId: current.appUser.id,
    content: data.content,
    postType: "poll",
    media: {
      type: "poll",
      options: result.options,
      totalVotes: result.totalVotes,
    } as unknown as Json,
    visibility: data.visibility,
    createdAt: new Date().toISOString(),
    author: authorRefFrom(current),
    pollOptions: result.options.map((opt) => ({
      id: opt.id,
      optionText: opt.optionText,
      voteCount: opt.voteCount,
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
