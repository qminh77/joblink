export const USER_ROLES = ["member", "company", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "banned",
  "deleted",
] as const
export type UserStatus = (typeof USER_STATUSES)[number]
