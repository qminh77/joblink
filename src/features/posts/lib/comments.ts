export const COMMENTS_INITIAL_LIMIT = 10
export const COMMENTS_LIMIT_STEP = 10
export const COMMENTS_MAX_LIMIT = 60

export function clampCommentsLimit(limit?: number) {
  if (!Number.isFinite(limit)) return COMMENTS_INITIAL_LIMIT
  return Math.min(
    COMMENTS_MAX_LIMIT,
    Math.max(COMMENTS_INITIAL_LIMIT, Math.floor(limit ?? COMMENTS_INITIAL_LIMIT)),
  )
}
