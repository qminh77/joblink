import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import {
  createNotification,
  deleteConnectionNotifications,
} from "@/features/notifications/services/notification-delivery.service"
import type { ActorRef } from "@/features/notifications/types"

// Điều phối notification của network. `createNotification`/`deleteConnection
// Notifications` dùng service-role nội bộ trong features/notifications/services —
// network không tự đụng admin client.

function actorRef(current: CurrentUser): ActorRef {
  return {
    userId: current.appUser.id,
    displayName: current.profile.displayName,
    avatarUrl: current.profile.avatarUrl,
  }
}

export async function notifyConnectionRequest(opts: {
  receiverId: number
  connectionId: number
  current: CurrentUser
}): Promise<void> {
  await createNotification({
    userId: opts.receiverId,
    type: "connection_request",
    payload: {
      type: "connection_request",
      connectionId: opts.connectionId,
      ...actorRef(opts.current),
    },
  })
}

export async function notifyConnectionAccepted(opts: {
  requesterId: number
  connectionId: number
  current: CurrentUser
}): Promise<void> {
  await createNotification({
    userId: opts.requesterId,
    type: "connection_accepted",
    payload: {
      type: "connection_accepted",
      connectionId: opts.connectionId,
      ...actorRef(opts.current),
    },
  })
}

export async function notifyUserFollowed(opts: {
  targetUserId: number
  current: CurrentUser
}): Promise<void> {
  if (opts.targetUserId === opts.current.appUser.id) return
  await createNotification({
    userId: opts.targetUserId,
    type: "user_followed",
    payload: {
      type: "user_followed",
      ...actorRef(opts.current),
    },
  })
}

// Dọn thông báo "X muốn kết nối" còn treo ở receiver khi sender huỷ lời mời.
export async function clearConnectionRequestNotifications(
  connectionId: number,
): Promise<void> {
  await deleteConnectionNotifications({
    connectionId,
    types: ["connection_request"],
  })
}
