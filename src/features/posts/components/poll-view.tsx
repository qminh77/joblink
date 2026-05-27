"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Check, Loader2 } from "lucide-react"

import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { useVote } from "../hooks"
import { mergePollData } from "../lib/poll"
import type { FeedPost } from "../types"

type Props = {
  post: FeedPost
}

export function PollView({ post }: Props) {
  const tPosts = useTranslations("posts")
  const user = useCurrentUser()
  const vote = useVote()

  const pollData = mergePollData(post.media, post.pollOptions)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (!pollData || pollData.options.length === 0) return null

  const isAuthor = user.id === post.authorId
  const hasVoted = pollData.options.some((o) => o.viewerVoted)
  const showResults = isAuthor || hasVoted
  const totalVotes = pollData.options.reduce((sum, o) => sum + o.voteCount, 0)

  function handleVote() {
    if (selectedId == null || vote.isPending) return
    vote.mutate({ postId: post.id, optionId: selectedId })
  }

  if (showResults) {
    return (
      <div className="mt-3 space-y-2">
        {pollData.options.map((option) => {
          const pct = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0
          const isVoted = option.viewerVoted
          return (
            <div
              key={option.id}
              className={`relative rounded-xl border overflow-hidden ${
                isVoted
                  ? "border-primary/50 bg-primary/[0.06]"
                  : "border-border/40 bg-muted/10"
              }`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`absolute inset-y-0 left-0 rounded-xl ${
                  isVoted
                    ? "bg-primary/10"
                    : "bg-muted/30"
                }`}
              />
              <div className="relative flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isVoted ? (
                    <Check className="w-4 h-4 shrink-0 text-primary" />
                  ) : null}
                  <span className="text-sm font-medium text-foreground truncate">
                    {option.optionText}
                  </span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground shrink-0 ml-3">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          )
        })}
        <p className="text-xs text-muted-foreground mt-1">
          {tPosts("totalVotes", { count: totalVotes })}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      {pollData.options.map((option) => {
        const isSelected = selectedId === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelectedId(isSelected ? null : option.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
              isSelected
                ? "border-primary bg-primary/[0.06]"
                : "border-border/40 bg-muted/10 hover:border-border/60 hover:bg-muted/20"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? "border-primary"
                  : "border-muted-foreground/40"
              }`}
            >
              {isSelected ? (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              ) : null}
            </div>
            <span className="text-sm font-medium text-foreground">
              {option.optionText}
            </span>
          </button>
        )
      })}
      <button
        type="button"
        onClick={handleVote}
        disabled={selectedId == null || vote.isPending}
        className="w-full mt-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {vote.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : null}
        {tPosts("vote")}
      </button>
    </div>
  )
}
