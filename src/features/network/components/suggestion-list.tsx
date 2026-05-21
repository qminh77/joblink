"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Check, Loader2, UserPlus } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getInitials } from "@/lib/utils/format"

import { useSendConnectionRequest, useSentConnectionIds } from "../hooks"
import type { NetworkUserCard } from "../types"

export function SuggestionList({
  suggestions,
}: {
  suggestions: NetworkUserCard[]
}) {
  const tHome = useTranslations("home")

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {tHome("noSuggestions")}
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {suggestions.map((connection) => (
        <SuggestionRow key={connection.userId} connection={connection} />
      ))}
    </ul>
  )
}

function SuggestionRow({ connection }: { connection: NetworkUserCard }) {
  const tButton = useTranslations("network.button")
  const send = useSendConnectionRequest()
  const sentIds = useSentConnectionIds()
  const isSent = sentIds.has(connection.userId)
  const secondary = connection.headline ?? connection.location

  const label = isSent ? tButton("sent") : tButton("connect")

  return (
    <li className="flex items-center gap-2.5">
      <Link href={`/profile/${connection.userId}`} className="shrink-0">
        <Avatar className="size-9 hover:opacity-80 transition-opacity">
          {connection.avatarUrl ? (
            <AvatarImage src={connection.avatarUrl} />
          ) : null}
          <AvatarFallback className="text-xs">
            {getInitials(connection.displayName, "JL")}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${connection.userId}`}
          className="text-[13px] font-semibold text-foreground truncate hover:text-primary transition-colors block leading-tight"
          title={connection.displayName}
        >
          {connection.displayName}
        </Link>
        {secondary ? (
          <p
            className="text-[11px] text-muted-foreground truncate mt-0.5"
            title={secondary}
          >
            {secondary}
          </p>
        ) : null}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant={isSent ? "secondary" : "outline"}
            className="rounded-full shrink-0"
            disabled={isSent || send.isPending}
            aria-label={label}
            onClick={() => {
              if (!isSent) send.mutate(connection.userId)
            }}
          >
            {send.isPending ? (
              <Loader2 className="animate-spin" />
            ) : isSent ? (
              <Check />
            ) : (
              <UserPlus />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </li>
  )
}
