import type { NotificationType } from "@/types/database"

export type { NotificationType }

export type ActorRef = {
  userId: number
  displayName: string
  avatarUrl: string | null
}

export type ConnectionRequestPayload = ActorRef & {
  connectionId: number
}

export type ConnectionAcceptedPayload = ActorRef & {
  connectionId: number
}

export type PostReactionPayload = ActorRef & {
  postId: number
  reactionType: string
}

export type PostCommentPayload = ActorRef & {
  postId: number
  commentId: number
  excerpt: string
}

export type PostSharePayload = ActorRef & {
  postId: number
  shareId: number
  excerpt: string | null
}

export type CommentMentionPayload = ActorRef & {
  postId: number
  commentId: number
  excerpt: string
}

export type NewMessagePayload = ActorRef & {
  conversationId: number
  excerpt: string
}

export type NotificationPayload =
  | ({ type: "connection_request" } & ConnectionRequestPayload)
  | ({ type: "connection_accepted" } & ConnectionAcceptedPayload)
  | ({ type: "post_reaction" } & PostReactionPayload)
  | ({ type: "post_comment" } & PostCommentPayload)
  | ({ type: "post_share" } & PostSharePayload)
  | ({ type: "comment_mention" } & CommentMentionPayload)
  | ({ type: "new_message" } & NewMessagePayload)

export type NotificationItem = {
  id: number
  type: NotificationType
  payload: NotificationPayload | null
  isRead: boolean
  createdAt: string
}
