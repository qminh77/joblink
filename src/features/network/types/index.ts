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
