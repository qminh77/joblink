"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { UserPlus } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils/format"

import { useSendConnectionRequest } from "../hooks"
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
    <ul className="space-y-4">
      {suggestions.map((connection) => (
        <SuggestionRow key={connection.userId} connection={connection} />
      ))}
    </ul>
  )
}

function SuggestionRow({ connection }: { connection: NetworkUserCard }) {
  const tButton = useTranslations("network.button")
  const send = useSendConnectionRequest()

  return (
    <li className="flex items-center gap-3">
      <Link href={`/profile/${connection.userId}`}>
        <Avatar className="w-10 h-10 border border-border/40 cursor-pointer hover:opacity-80 transition-opacity">
          {connection.avatarUrl ? (
            <AvatarImage src={connection.avatarUrl} />
          ) : null}
          <AvatarFallback>
            {getInitials(connection.displayName, "JL")}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${connection.userId}`}
          className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors block leading-tight"
        >
          {connection.displayName}
        </Link>
        <p className="text-[11px] text-muted-foreground truncate">
          {connection.headline ?? connection.location ?? ""}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 rounded-full shrink-0 text-xs font-medium px-3 text-primary border-primary/40 hover:bg-primary/10"
        disabled={send.isPending}
        onClick={() => send.mutate(connection.userId)}
      >
        {send.isPending ? (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </span>
        ) : (
          <>
            <UserPlus className="w-3 h-3 mr-1" /> {tButton("connect")}
          </>
        )}
      </Button>
    </li>
  )
}
