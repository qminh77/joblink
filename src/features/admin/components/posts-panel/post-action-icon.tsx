import { EyeOff, RotateCcw, Trash2 } from "lucide-react"

import type { PostModerationAction } from "../../lib/post-moderation"

export function PostActionIcon({
  action,
}: {
  action: PostModerationAction
}) {
  if (action === "hide") return <EyeOff className="w-4 h-4" />
  if (action === "restore") return <RotateCcw className="w-4 h-4" />
  return <Trash2 className="w-4 h-4" />
}
