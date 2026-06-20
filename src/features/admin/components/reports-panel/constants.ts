import { Flag, MessageSquare, User } from "lucide-react"

import type { ReportStatus, ReportTargetType } from "@/lib/constants"
import type { ModerationActionType } from "@/types/database"

export const STATUS_STYLE: Record<ReportStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_review: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-border/30",
}

export const TARGET_ICON: Record<ReportTargetType, typeof Flag> = {
  user: User,
  post: Flag,
  comment: MessageSquare,
  job: Flag,
  company: Flag,
}

export const ACTION_TYPES: ModerationActionType[] = [
  "hide",
  "delete",
  "warn",
  "suspend",
  "ban",
  "restore",
  "dismiss",
]
