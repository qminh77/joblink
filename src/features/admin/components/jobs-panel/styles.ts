import type { JobStatus } from "@/lib/constants"

export const STATUS_STYLE: Record<JobStatus, string> = {
  draft: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  closed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  expired: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  removed: "bg-red-500/10 text-red-600 border-red-500/20",
}
