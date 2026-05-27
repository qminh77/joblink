import type { Json } from "@/types/database"
import type { PollOption } from "../types"

export type PollData = {
  options: PollOption[]
  totalVotes: number
}

export function readPollData(media: Json | null): PollData | null {
  if (!media || typeof media !== "object" || Array.isArray(media)) return null
  const obj = media as Record<string, unknown>
  if (obj.type !== "poll") return null
  if (!Array.isArray(obj.options)) return null

  const options: PollOption[] = []
  for (const raw of obj.options as unknown[]) {
    if (!raw || typeof raw !== "object") continue
    const r = raw as Record<string, unknown>
    const id = Number(r.id)
    const optionText = String(r.optionText ?? "")
    const voteCount = Number(r.voteCount ?? 0)
    if (!Number.isFinite(id) || !optionText) continue
    options.push({
      id,
      optionText,
      voteCount,
      viewerVoted: false,
    })
  }

  const totalVotes = Number(obj.totalVotes ?? 0)
  return { options, totalVotes }
}

export function mergePollData(
  media: Json | null,
  pollOptions?: PollOption[],
): PollData | null {
  const fromMedia = readPollData(media)
  if (!fromMedia) return null

  if (pollOptions && pollOptions.length > 0) {
    const totalVotes = pollOptions.reduce((sum, o) => sum + o.voteCount, 0)
    return { options: pollOptions, totalVotes }
  }

  // Fallback: use option text from media but hide vote counts.
  // The RPC always supplies pollOptions for poll posts; this path
  // is only reached in edge cases (network error, stale cache) and
  // must not leak vote counts to non-voters.
  return {
    options: fromMedia.options.map((o) => ({
      id: o.id,
      optionText: o.optionText,
      voteCount: 0,
      viewerVoted: false,
    })),
    totalVotes: 0,
  }
}

export function buildPollMedia(
  options: { id: number; optionText: string; voteCount: number }[],
  totalVotes: number,
): Json {
  return {
    type: "poll",
    options: options.map((o) => ({
      id: o.id,
      optionText: o.optionText,
      voteCount: o.voteCount,
    })),
    totalVotes,
  } as unknown as Json
}
