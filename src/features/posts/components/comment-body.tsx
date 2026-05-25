import Link from "next/link"

import { parseMentionTokens } from "../lib/mentions"

export function CommentBody({ content }: { content: string }) {
  const tokens = parseMentionTokens(content)
  return (
    <p className="text-[12.5px] text-foreground/90 whitespace-pre-line break-words leading-snug mt-0.5">
      {tokens.map((t, i) => {
        if (t.kind === "text") return <span key={i}>{t.text}</span>
        return (
          <Link
            key={i}
            href={`/profile/${t.userId}`}
            className="text-primary font-medium hover:underline"
          >
            @{t.displayName}
          </Link>
        )
      })}
    </p>
  )
}
