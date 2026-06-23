import {
  AtSign,
  BarChart2,
  Bell,
  Briefcase,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  ThumbsUp,
  UserPlus,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react"

import type { NotificationItem, NotificationType } from "../types"

export type NotificationVisual = {
  icon: LucideIcon
  iconClassName: string
  href: string
  actorName: string | null
  actorAvatarUrl: string | null
  actorUserId: number | null
}

export function getNotificationLabelParams(
  item: NotificationItem,
  translateAppStatus: (status: string) => string,
): Record<string, string> {
  const payload = item.payload
  if (!payload) return {}
  switch (item.type) {
    case "job_application_received":
    case "application_withdrawn":
      return payload.type === item.type ? { jobTitle: payload.jobTitle } : {}
    case "application_status_changed":
      if (payload.type !== item.type) return {}
      return {
        jobTitle: payload.jobTitle,
        status: translateAppStatus(payload.newStatus),
      }
    default:
      return {}
  }
}

const VISUALS: Record<
  NotificationType,
  Pick<NotificationVisual, "icon" | "iconClassName">
> = {
  connection_request: {
    icon: UserPlus,
    iconClassName: "text-purple-500 bg-purple-500/10",
  },
  connection_accepted: {
    icon: Users,
    iconClassName: "text-emerald-500 bg-emerald-500/10",
  },
  post_reaction: {
    icon: ThumbsUp,
    iconClassName: "text-blue-500 bg-blue-500/10",
  },
  post_comment: {
    icon: MessageCircle,
    iconClassName: "text-amber-500 bg-amber-500/10",
  },
  post_share: {
    icon: Share2,
    iconClassName: "text-sky-500 bg-sky-500/10",
  },
  comment_mention: {
    icon: AtSign,
    iconClassName: "text-pink-500 bg-pink-500/10",
  },
  new_message: {
    icon: MessageSquare,
    iconClassName: "text-indigo-500 bg-indigo-500/10",
  },
  company_followed: {
    icon: UserPlus,
    iconClassName: "text-emerald-500 bg-emerald-500/10",
  },
  user_followed: {
    icon: UserPlus,
    iconClassName: "text-emerald-500 bg-emerald-500/10",
  },
  job_application_received: {
    icon: Send,
    iconClassName: "text-blue-500 bg-blue-500/10",
  },
  application_status_changed: {
    icon: Briefcase,
    iconClassName: "text-amber-500 bg-amber-500/10",
  },
  application_withdrawn: {
    icon: XCircle,
    iconClassName: "text-rose-500 bg-rose-500/10",
  },
  poll_vote: {
    icon: BarChart2,
    iconClassName: "text-orange-500 bg-orange-500/10",
  },
}


const FALLBACK = {
  icon: Bell,
  iconClassName: "text-muted-foreground bg-muted",
}

export function getNotificationVisual(
  item: NotificationItem,
): NotificationVisual {
  const base = VISUALS[item.type] ?? FALLBACK
  const payload = item.payload

  switch (item.type) {
    case "connection_request":
      return {
        ...base,
        href: "/network",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    case "connection_accepted":
      return {
        ...base,
        href:
          payload?.type === item.type ? `/profile/${payload.userId}` : "/network",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    case "post_reaction":
    case "post_comment":
    case "post_share":
    case "comment_mention":
    case "poll_vote":
      return {
        ...base,
        href:
          payload?.type === item.type
            ? `/posts/${payload.postId}`
            : "/home",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    case "new_message":
      return {
        ...base,
        href:
          payload?.type === item.type
            ? `/messages?c=${payload.conversationId}`
            : "/messages",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    case "company_followed":
    case "user_followed":
      return {
        ...base,
        href:
          payload?.type === item.type
            ? `/profile/${payload.userId}`
            : "/profile",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    case "job_application_received":
    case "application_withdrawn":
      return {
        ...base,
        href:
          payload?.type === item.type ? `/jobs/${payload.jobId}` : "/jobs",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    case "application_status_changed":
      return {
        ...base,
        href:
          payload?.type === item.type ? `/jobs/${payload.jobId}` : "/jobs",
        actorName: payload?.type === item.type ? payload.displayName : null,
        actorAvatarUrl: payload?.type === item.type ? payload.avatarUrl : null,
        actorUserId: payload?.type === item.type ? payload.userId : null,
      }
    default:
      return {
        ...FALLBACK,
        href: "/notifications",
        actorName: null,
        actorAvatarUrl: null,
        actorUserId: null,
      }
  }
}
