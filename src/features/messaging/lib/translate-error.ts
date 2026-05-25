"use client"

type Translator = (key: string) => string

/**
 * Set các error code do RPC messaging trả về — khớp với keys ở
 * messages.errors.*. Nếu thông báo lỗi không nằm trong whitelist này, in
 * raw message để tránh next-intl "MISSING_MESSAGE" warning vô nghĩa.
 */
const KNOWN_ERROR_CODES = new Set([
  "invalidConversation",
  "invalidUser",
  "emptyContent",
  "tooLong",
  "notParticipant",
  "notConnected",
  "cannotMessageSelf",
  "blocked",
  "blockedByMe",
  "blockedMe",
  "rateLimited",
  "unauthorized",
  "unknown",
])

export function translateMessagingError(
  tErr: Translator,
  raw: string | undefined | null,
): string {
  if (!raw) return tErr("unknown")
  if (KNOWN_ERROR_CODES.has(raw)) return tErr(raw)
  return raw
}
