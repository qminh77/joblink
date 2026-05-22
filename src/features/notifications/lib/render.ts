import {
  Bell,
  MessageCircle,
  Share2,
  ThumbsUp,
  UserPlus,
  Users,
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
      return {
        ...base,
        href: "/home",
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
