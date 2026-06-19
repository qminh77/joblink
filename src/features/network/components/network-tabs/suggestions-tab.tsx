"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Check, MapPin, UserPlus, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import { useSendConnectionRequest, useSentConnectionIds } from "../../hooks"
import type { NetworkUserCard } from "../../types"
import { EmptyStateCard } from "./empty-state-card"

function SuggestionCard({ item }: { item: NetworkUserCard }) {
  const tButton = useTranslations("network.button")
  const send = useSendConnectionRequest()
  const sentIds = useSentConnectionIds()
  const isSent = sentIds.has(item.userId)

  return (
    <Card className="p-4 h-full">
      <div className="flex flex-col items-center text-center gap-1.5 h-full">
        <Link href={profileHref(item.userId, item.role)}>
          <Avatar className="size-14 cursor-pointer hover:opacity-80 transition-opacity">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
            <AvatarFallback className="text-sm">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link
          href={profileHref(item.userId, item.role)}
          className="font-semibold text-sm text-foreground hover:text-primary transition-colors leading-tight line-clamp-1 mt-0.5"
        >
          {item.displayName}
        </Link>
        {item.headline ? (
          <p className="text-xs text-muted-foreground leading-tight line-clamp-1">
            {item.headline}
          </p>
        ) : null}
        {item.location ? (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        ) : null}

        <div className="mt-auto pt-2 w-full">
          {isSent ? (
            <Button
              size="sm"
              variant="secondary"
              disabled
              className="w-full"
            >
              <Check /> {tButton("sent")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="w-full"
              disabled={send.isPending}
              onClick={() => send.mutate(item.userId)}
            >
              <UserPlus />
              {send.isPending ? tButton("sending") : tButton("connect")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export function SuggestionsTab({
  items,
  isFiltered,
}: {
  items: NetworkUserCard[]
  isFiltered: boolean
}) {
  const t = useTranslations("network.suggestions")

  if (items.length === 0) {
    return (
      <EmptyStateCard
        icon={Users}
        title={isFiltered ? t("notFoundTitle") : t("emptyTitle")}
        description={isFiltered ? t("notFoundDesc") : t("emptyDesc")}
      />
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <SuggestionCard key={item.userId} item={item} />
      ))}
    </div>
  )
}
