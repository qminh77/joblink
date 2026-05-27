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

export type CompanyFollowedPayload = ActorRef & {
  // companyUserId trùng với recipient (notification.user_id) — không cần lưu
  // riêng, nhưng giữ field actor để render avatar + link tới /profile/{actor}.
}

export type JobApplicationReceivedPayload = ActorRef & {
  jobId: number
  jobTitle: string
  applicationId: number
}

export type ApplicationStatusChangedPayload = ActorRef & {
  jobId: number
  jobTitle: string
  applicationId: number
  newStatus:
    | "applied"
    | "reviewed"
    | "interview"
    | "offered"
    | "hired"
    | "rejected"
}

export type ApplicationWithdrawnPayload = ActorRef & {
  jobId: number
  jobTitle: string
  applicationId: number
}

export type PollVotePayload = ActorRef & {
  postId: number
  optionText: string
}

export type InterviewScheduledPayload = ActorRef & {
  jobId: number
  jobTitle: string
  applicationId: number
  scheduledAt: string
}

export type InterviewResponsePayload = ActorRef & {
  jobId: number
  jobTitle: string
  applicationId: number
  accepted: boolean
}

export type NotificationPayload =
  | ({ type: "connection_request" } & ConnectionRequestPayload)
  | ({ type: "connection_accepted" } & ConnectionAcceptedPayload)
  | ({ type: "post_reaction" } & PostReactionPayload)
  | ({ type: "post_comment" } & PostCommentPayload)
  | ({ type: "post_share" } & PostSharePayload)
  | ({ type: "comment_mention" } & CommentMentionPayload)
  | ({ type: "new_message" } & NewMessagePayload)
  | ({ type: "company_followed" } & CompanyFollowedPayload)
  | ({ type: "job_application_received" } & JobApplicationReceivedPayload)
  | ({ type: "application_status_changed" } & ApplicationStatusChangedPayload)
  | ({ type: "application_withdrawn" } & ApplicationWithdrawnPayload)
  | ({ type: "poll_vote" } & PollVotePayload)
  | ({ type: "interview_scheduled" } & InterviewScheduledPayload)
  | ({ type: "interview_response" } & InterviewResponsePayload)

export type NotificationItem = {
  id: number
  type: NotificationType
  payload: NotificationPayload | null
  isRead: boolean
  createdAt: string
}
