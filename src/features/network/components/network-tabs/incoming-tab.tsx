"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Check, MapPin, UserPlus, Users, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import {
  useAcceptConnectionRequest,
  useRejectConnectionRequest,
} from "../../hooks"
import type { InvitationItem } from "../../types"
import { EmptyStateCard } from "./empty-state-card"

function IncomingCard({ item }: { item: InvitationItem }) {
  const t = useTranslations("network.invitations")
  const accept = useAcceptConnectionRequest()
  const reject = useRejectConnectionRequest()
  const isBusy = accept.isPending || reject.isPending

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href={profileHref(item.userId, item.role)}>
          <Avatar className="size-10 cursor-pointer hover:opacity-80 transition-opacity">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
            <AvatarFallback className="text-xs">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={profileHref(item.userId, item.role)}
            className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors block"
          >
            {item.displayName}
          </Link>
          {item.headline ? (
            <p className="text-xs text-muted-foreground truncate">
              {item.headline}
            </p>
          ) : null}
          {item.location ? (
            <p className="text-[11px] text-muted-foreground/70 flex items-center mt-0.5">
              <MapPin className="size-3 mr-0.5" /> {item.location}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="hover:bg-destructive/10 hover:text-destructive"
            disabled={isBusy}
            onClick={() => reject.mutate(item.connectionId)}
          >
            <X /> {t("reject")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:bg-primary/10 hover:text-primary"
            disabled={isBusy}
            onClick={() => accept.mutate(item.connectionId)}
          >
            <Check /> {t("accept")}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function IncomingTab({
  items,
  onExplore,
}: {
  items: InvitationItem[]
  onExplore: () => void
}) {
  const t = useTranslations("network.invitations")

  if (items.length === 0) {
    return (
      <EmptyStateCard
        icon={Users}
        title={t("emptyTitle")}
        description={t("emptyDesc")}
        action={
          <Button variant="ghost" size="sm" onClick={onExplore}>
            <UserPlus /> {t("explore")}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <IncomingCard key={item.connectionId} item={item} />
      ))}
    </div>
  )
}
