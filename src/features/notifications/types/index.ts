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

export type NotificationPayload =
  | ({ type: "connection_request" } & ConnectionRequestPayload)
  | ({ type: "connection_accepted" } & ConnectionAcceptedPayload)

export type NotificationItem = {
  id: number
  type: NotificationType
  payload: NotificationPayload | null
  isRead: boolean
  createdAt: string
}
