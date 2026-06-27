import { EyeOff, RotateCcw, Trash2 } from "lucide-react"

export type PostModerationAction = "hide" | "restore" | "delete"

export const POST_STATUSES = ["active", "hidden"] as const

export const TYPE_STYLE: Record<string, string> = {
  text: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  image: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  video: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  article: "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

export const VISIBILITY_STYLE: Record<string, string> = {
  public: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  connections: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  private: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

export const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  hidden: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  deleted: "bg-red-500/10 text-red-600 border-red-500/20",
}

export const ACTION_STYLE: Record<PostModerationAction, string> = {
  hide: "text-amber-500 hover:bg-amber-500/10",
  restore: "text-emerald-500 hover:bg-emerald-500/10",
  delete: "text-red-500 hover:bg-red-500/10",
}

export function PostActionIcon({
  action,
}: {
  action: PostModerationAction
}) {
  if (action === "hide") return <EyeOff className="w-4 h-4" />
  if (action === "restore") return <RotateCcw className="w-4 h-4" />
  return <Trash2 className="w-4 h-4" />
}
