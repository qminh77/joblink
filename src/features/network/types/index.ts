import type { UserRole } from "@/lib/constants"

export type NetworkUserCard = {
  userId: number
  role: UserRole
  displayName: string
  avatarUrl: string | null
  headline: string | null
  location: string | null
}

export type ConnectionItem = NetworkUserCard & {
  connectionId: number
  connectedAt: string
}

export type InvitationItem = NetworkUserCard & {
  connectionId: number
  requestedAt: string
  direction: "incoming" | "outgoing"
}

export type ConnectionRelation =
  | { kind: "none" }
  | { kind: "self" }
  | { kind: "pending_outgoing"; connectionId: number }
  | { kind: "pending_incoming"; connectionId: number }
  | { kind: "accepted"; connectionId: number }
  | { kind: "rejected"; connectionId: number }
  | { kind: "blocked"; connectionId: number }

export type NetworkOverview = {
  suggestions: NetworkUserCard[]
  connections: ConnectionItem[]
  incoming: InvitationItem[]
  outgoing: InvitationItem[]
}

export type ToggleFollowUserResult =
  | { ok: true; isFollowing: boolean; followerCount: number }
  | { ok: false; error: string }

// Trạng thái chặn theo góc nhìn của viewer với một người cụ thể. Chỉ mang chiều
// "tôi đã chặn họ" — chiều ngược lại được ẩn theo quyền riêng tư (xem RLS).
export type BlockStatus = {
  blockedByMe: boolean
}

export type BlockedUserItem = {
  blockId: number
  userId: number
  blockedAt: string
  displayName: string
  avatarUrl: string | null
  headline: string | null
}
