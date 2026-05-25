"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { CornerDownRight, Loader2, Send, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import type { MentionableUser } from "../api/actions"
import { serializeMention } from "../lib/mentions"

import { MentionPopover } from "./mention-popover"

export type ReplyTarget = { userId: number; displayName: string }

// Detect token `@xxx` đang gõ ở vị trí caret hiện tại.
// Trả về { start, query } nếu match — start là index ký tự `@`, query là phần sau.
function findActiveMention(value: string, caret: number): { start: number; query: string } | null {
  let i = caret - 1
  while (i >= 0) {
    const ch = value[i]!
    if (ch === "@") {
      const before = i === 0 ? " " : value[i - 1]!
      // Ký tự trước @ phải là khoảng trắng/đầu chuỗi/dấu xuống dòng — tránh trigger
      // ở giữa email/handle khác.
      if (!/\s/.test(before) && before !== "@") return null
      return { start: i, query: value.slice(i + 1, caret) }
    }
    if (/\s/.test(ch)) return null
    i--
  }
  return null
}

export function CommentInput({
  onSubmit,
  isSubmitting,
  placeholder,
  autoFocus = false,
  replyTo,
  onCancel,
  compact = false,
}: {
  onSubmit: (content: string) => void
  isSubmitting: boolean
  placeholder?: string
  autoFocus?: boolean
  // Khi set, hiển thị chip "Đang trả lời @Name" và tự prepend mention
  // markup vào content khi submit. Textarea giữ sạch để user gõ tự nhiên.
  replyTo?: ReplyTarget
  onCancel?: () => void
  compact?: boolean
}) {
  const t = useTranslations("feed")
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const [value, setValue] = useState("")
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null)
  const [mentionResults, setMentionResults] = useState<MentionableUser[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  // Pending mentions: textarea hiển thị `@DisplayName` sạch cho user; khi
  // submit ta thay (first match) bằng markup `@[Name](id)`. Cho phép vài
  // case quen thuộc của FB: pick xong xoá → mention drop; pick 2 lần cùng
  // người → có 2 token; viết text `@Name` thường → vẫn là plain text.
  const [pendingMentions, setPendingMentions] = useState<
    { userId: number; displayName: string }[]
  >([])
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && taRef.current) {
      taRef.current.focus()
      const len = taRef.current.value.length
      taRef.current.setSelectionRange(len, len)
    }
  }, [autoFocus])

  // Khi user thay đổi token mention (gõ tiếp/xoá) → reset highlight về đầu list.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0)
  }, [mention?.query])

  const insertMention = useCallback(
    (u: MentionableUser) => {
      if (!mention) return
      const ta = taRef.current
      const caret = ta?.selectionStart ?? value.length
      const before = value.slice(0, mention.start)
      const after = value.slice(caret)
      // Hiển thị "@Display Name" sạch trong textarea; markup được sinh lúc submit.
      const display = `@${u.displayName}`
      const next = `${before}${display} ${after}`
      setValue(next)
      setPendingMentions((prev) => [
        ...prev,
        { userId: u.userId, displayName: u.displayName },
      ])
      setMention(null)
      setMentionResults([])
      requestAnimationFrame(() => {
        if (!taRef.current) return
        const pos = (before + display + " ").length
        taRef.current.focus()
        taRef.current.setSelectionRange(pos, pos)
      })
    },
    [mention, value],
  )

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value
    setValue(next)
    const caret = e.target.selectionStart ?? next.length
    setMention(findActiveMention(next, caret))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mention && mentionResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % mentionResults.length)
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length)
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        const picked = mentionResults[activeIndex]
        if (picked) insertMention(picked)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setMention(null)
        return
      }
    }
    // Cmd/Ctrl+Enter để submit; Enter thường = newline.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      submit()
    }
    if (e.key === "Escape" && onCancel) {
      e.preventDefault()
      onCancel()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || isSubmitting) return

    // Bước 1: thay từng `@DisplayName` đầu tiên còn lại trong text bằng markup.
    // Mỗi pending mention chỉ tiêu thụ 1 occurrence — nếu user đã xoá tay
    // thì mention đó đơn giản bị bỏ qua.
    let content = trimmed
    for (const m of pendingMentions) {
      const needle = `@${m.displayName}`
      const idx = content.indexOf(needle)
      if (idx === -1) continue
      content =
        content.slice(0, idx) +
        serializeMention(m.userId, m.displayName) +
        content.slice(idx + needle.length)
    }

    // Bước 2: replyTo prepend tự động (nếu chưa có markup cho user đó).
    const tag = replyTo
      ? serializeMention(replyTo.userId, replyTo.displayName)
      : ""
    const alreadyTagged = replyTo
      ? new RegExp(`@\\[[^\\]]+\\]\\(${replyTo.userId}\\)`).test(content)
      : true
    const finalContent = !alreadyTagged ? `${tag} ${content}` : content

    onSubmit(finalContent)
    setValue("")
    setPendingMentions([])
    setMention(null)
  }

  return (
    <div className="flex gap-2">
      <Avatar className={compact ? "w-7 h-7" : "w-8 h-8"}>
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
        <AvatarFallback className={compact ? "text-[10px]" : undefined}>
          {userInitials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 flex flex-col gap-1">
        {replyTo ? (
          <div className="inline-flex items-center self-start gap-1 pl-2 pr-1 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            <CornerDownRight className="w-3 h-3" />
            <span>
              {t("replyingTo")} <span className="font-semibold">@{replyTo.displayName}</span>
            </span>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                aria-label={t("cancelReply")}
                className="ml-0.5 p-0.5 rounded-full hover:bg-primary/15 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="relative flex items-end gap-1.5">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSelect={(e) => {
            const ta = e.currentTarget
            setMention(findActiveMention(ta.value, ta.selectionStart ?? 0))
          }}
          placeholder={
            placeholder ??
            (replyTo
              ? t("writeReplyTo", { name: replyTo.displayName })
              : t("writeComment"))
          }
          className="flex-1 min-h-9 max-h-32 resize-none rounded-2xl bg-muted/60 px-3 py-1.5 text-[13px] leading-tight outline-none focus:ring-2 focus:ring-primary/30 transition"
        />
        <Button
          type="button"
          onClick={submit}
          size="icon-sm"
          variant="ghost"
          disabled={!value.trim() || isSubmitting}
          aria-label={t("send")}
          className="text-primary shrink-0"
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
        {onCancel && !replyTo ? (
          <Button
            type="button"
            onClick={onCancel}
            size="icon-sm"
            variant="ghost"
            aria-label={t("cancelReply")}
            className="shrink-0"
          >
            <X />
          </Button>
        ) : null}
        {mention ? (
          <MentionPopover
            query={mention.query}
            activeIndex={activeIndex}
            onPick={insertMention}
            onResults={setMentionResults}
          />
        ) : null}
        </div>
      </div>
    </div>
  )
}
