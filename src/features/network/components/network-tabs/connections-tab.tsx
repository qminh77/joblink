"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Building2, MapPin, Search, UserMinus, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import { useRemoveConnection } from "../../hooks"
import type { ConnectionItem } from "../../types"
import { EmptyStateCard } from "./empty-state-card"
import { RemoveConnectionDialog } from "./remove-connection-dialog"

function ConnectionRow({ item }: { item: ConnectionItem }) {
  const t = useTranslations("network.connections")
  const tButton = useTranslations("network.button")
  const remove = useRemoveConnection()

  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/30 transition-colors">
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
          className="font-semibold text-sm text-foreground hover:text-primary transition-colors block truncate"
        >
          {item.displayName}
        </Link>
        {item.headline ? (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Building2 className="size-3 shrink-0" /> {item.headline}
          </p>
        ) : null}
        {item.location ? (
          <p className="text-[11px] text-muted-foreground/70 flex items-center mt-0.5">
            <MapPin className="size-3 mr-0.5" /> {item.location}
          </p>
        ) : null}
      </div>
      <RemoveConnectionDialog
        displayName={item.displayName}
        isPending={remove.isPending}
        onConfirm={() => remove.mutate(item.connectionId)}
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={remove.isPending}
          aria-label={t("removeAction")}
        >
          <UserMinus />
          <span className="hidden sm:inline">
            {remove.isPending ? tButton("removing") : t("removeAction")}
          </span>
        </Button>
      </RemoveConnectionDialog>
    </div>
  )
}

export function ConnectionsTab({
  items,
  total,
  query,
  onQueryChange,
}: {
  items: ConnectionItem[]
  total: number
  query: string
  onQueryChange: (value: string) => void
}) {
  const t = useTranslations("network.connections")
  const tNetwork = useTranslations("network")

  if (total === 0) {
    return (
      <EmptyStateCard
        icon={Users}
        title={t("emptyTitle")}
        description={t("emptyDesc")}
      />
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="px-5 py-3.5 border-b border-border/10 flex items-center justify-between gap-3">
        <h2 className="font-headline font-bold text-sm sm:text-base text-foreground">
          {t("allTitle")}{" "}
          <span className="text-muted-foreground font-normal">({total})</span>
        </h2>
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8 h-8 rounded-full bg-muted border-none text-xs"
            placeholder={tNetwork("searchConnectionsPlaceholder")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          {t("noMatch")}
        </div>
      ) : (
        <div className="divide-y divide-border/10">
          {items.map((item) => (
            <ConnectionRow key={item.connectionId} item={item} />
          ))}
        </div>
      )}
    </Card>
  )
}
