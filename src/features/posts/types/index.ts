import type { UserRole } from "@/lib/constants"
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

export type HomeFeedPayload = {
  stats: HomeFeedStats
  suggestions: NetworkUserCard[]
  posts: FeedPost[]
  connection_ids: number[]
  me: number | null
  next_cursor: string | null
}

export type FeedPage = {
  posts: FeedPost[]
  nextCursor: string | null
}

export type { PostReactionType }
