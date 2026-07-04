export type PostModerationAction = "hide" | "restore" | "delete"

export const ADMIN_POST_STATUSES = ["active", "hidden"] as const
export type AdminPostStatus = (typeof ADMIN_POST_STATUSES)[number]

export const POST_TYPE_STYLE: Record<string, string> = {
  text: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
  image: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  video: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  article: "bg-blue-500/10 text-blue-600 border-blue-500/20",
}

export const POST_VISIBILITY_STYLE: Record<string, string> = {
  public: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  connections: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  private: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20",
}

export const ADMIN_POST_STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  hidden: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  deleted: "bg-red-500/10 text-red-600 border-red-500/20",
}

export const POST_ACTION_STYLE: Record<PostModerationAction, string> = {
  hide: "text-amber-500 hover:bg-amber-500/10",
  restore: "text-emerald-500 hover:bg-emerald-500/10",
  delete: "text-red-500 hover:bg-red-500/10",
}
