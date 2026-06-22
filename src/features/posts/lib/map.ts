import type { CurrentUser } from "@/features/auth/types"
import type { Json, PostType, PostVisibility } from "@/types/database"

import type { FeedAuthor, FeedComment, FeedPost, PollOption } from "../types"

// Map row/ngữ cảnh → domain. Gom ở đây để khối `author { userId, role,
// displayName, avatarUrl, headline }` không bị dựng lại rải rác trong action.

export function authorRefFrom(current: CurrentUser): FeedAuthor {
  return {
    userId: current.appUser.id,
    role: current.appUser.account_type,
    displayName: current.profile.displayName,
    avatarUrl: current.profile.avatarUrl,
    headline: current.profile.headline,
  }
}

/** FeedPost cho bài vừa tạo/chia sẻ — counters về 0, viewer chưa react. */
export function newFeedPost(input: {
  id: number
  authorId: number
  content: string
  postType: PostType
  media: Json | null
  visibility: PostVisibility
  createdAt: string
  author: FeedAuthor
  pollOptions?: PollOption[]
}): FeedPost {
  return {
    ...input,
    pollOptions: input.pollOptions,
    reactionCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewerReacted: false,
  }
}

export function newFeedComment(
  row: {
    id: number
    post_id: number
    user_id: number
    parent_id: number | null
    content: string
    created_at: string
  },
  author: FeedAuthor,
): FeedComment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
    author,
  }
}
