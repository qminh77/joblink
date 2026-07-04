import type { UserRole } from "@/features/auth/lib/constants"
import type {
  Json,
  PostReactionType,
  PostType,
  PostVisibility,
} from "@/types/database"
import type { NetworkUserCard } from "@/features/network/types"

export type FeedAuthor = {
  userId: number
  role: UserRole
  displayName: string
  avatarUrl: string | null
  headline: string | null
}

export type FeedPost = {
  id: number
  authorId: number
  content: string
  postType: PostType
  media: Json | null
  visibility: PostVisibility
  createdAt: string
  author: FeedAuthor
  reactionCount: number
  commentCount: number
  shareCount: number
  viewerReacted: boolean
}

export type HomeFeedStats = {
  connection_count: number
  profile_view_count: number
}

/**
 * Tin tuyển dụng hiển thị trong feed / sidebar gợi ý. Shape khớp jsonb camelCase
 * do RPC get_home_feed trả về (xem migration 20260601_029). Không có
 * reaction/comment — render bằng JobFeedCard, đọc-then-điều-hướng tới /jobs/[id].
 */
export type FeedJob = {
  id: number
  title: string
  companyUserId: number
  companyName: string
  companyLogoUrl: string | null
  companyVerified: boolean
  provinceName: string | null
  wardName: string | null
  jobTypeName: string | null
  workModeName: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
  createdAt: string
  viewerSaved: boolean
  viewerApplied: boolean
}

export type HomeFeedPayload = {
  stats: HomeFeedStats
  suggestions: NetworkUserCard[]
  suggested_jobs: FeedJob[]
  posts: FeedPost[]
  jobs: FeedJob[]
  connection_ids: number[]
  me: number | null
  next_cursor: string | null
}

export type FeedPage = {
  posts: FeedPost[]
  jobs: FeedJob[]
  nextCursor: string | null
}

// Profile posts: không trộn job (chỉ feed home mới interleave), nên không kế
// thừa `jobs` từ FeedPage.
export type UserPostsPage = {
  posts: FeedPost[]
  nextCursor: string | null
  canView: boolean
}

export type FeedComment = {
  id: number
  postId: number
  userId: number
  parentId: number | null
  content: string
  createdAt: string
  author: FeedAuthor
}

export type MentionableUser = {
  userId: number
  displayName: string
  avatarUrl: string | null
  headline: string | null
}

export type CreatePostActionInput = {
  content: string
  visibility?: "public" | "connections" | "private"
  mediaItems?: { url: string; width?: number; height?: number }[]
  videoUrl?: string
}

export type ToggleReactionResult = { reacted: boolean }

export type CreateCommentActionInput = {
  postId: number
  content: string
  parentId?: number | null
}

export type CreateCommentResult = { comment: FeedComment }

export type DeleteCommentResult = { commentId: number; postId: number }

export type SharePostActionInput = {
  postId: number
  commentContent?: string | null
}

export type SharePostResult = { shareId: number; post: FeedPost }

export type UpdatePostActionInput = {
  postId: number
  content: string
  visibility: "public" | "connections" | "private"
  mediaItems?: { url: string; width?: number; height?: number }[]
}

export type UpdatePostResult = {
  postId: number
  content: string
  visibility: PostVisibility
  media: Json | null
  postType: PostType
  updatedAt: string
}

export type { PostReactionType }
