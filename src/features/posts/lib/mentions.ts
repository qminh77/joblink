// Mentions trong content được lưu dạng inline markup:
//   @[Tên hiển thị](userId)
// Lưu cùng `content` plain text → không cần đổi schema DB. Khi render,
// helper này tách content thành tokens để mỗi mention trở thành <Link>.

export type MentionToken =
  | { kind: "text"; text: string }
  | { kind: "mention"; userId: number; displayName: string }

// Khớp `@[Display Name](42)` — name không chứa dấu `]`, id là số.
const MENTION_RE = /@\[([^\]]+)\]\((\d+)\)/g

export function parseMentionTokens(content: string): MentionToken[] {
  const tokens: MentionToken[] = []
  let lastIndex = 0
  for (const match of content.matchAll(MENTION_RE)) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      tokens.push({ kind: "text", text: content.slice(lastIndex, start) })
    }
    tokens.push({
      kind: "mention",
      displayName: match[1]!,
      userId: Number(match[2]),
    })
    lastIndex = start + match[0].length
  }
  if (lastIndex < content.length) {
    tokens.push({ kind: "text", text: content.slice(lastIndex) })
  }
  return tokens
}

export function extractMentionedUserIds(content: string): number[] {
  const ids = new Set<number>()
  for (const match of content.matchAll(MENTION_RE)) {
    ids.add(Number(match[2]))
  }
  return Array.from(ids)
}

export function serializeMention(userId: number, displayName: string): string {
  // Loại ký tự ] khỏi displayName để giữ tokenizer đơn giản.
  const safe = displayName.replace(/]/g, "")
  return `@[${safe}](${userId})`
}

// Dùng cho excerpt notification: hiển thị mention dưới dạng `@Name` (text).
export function mentionsToPlainText(content: string): string {
  return content.replace(MENTION_RE, (_, name) => `@${name}`)
}
