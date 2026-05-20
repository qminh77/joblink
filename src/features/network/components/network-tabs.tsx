"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Building2,
  Check,
  MapPin,
  Search,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInitials } from "@/lib/utils/format"

import {
  useAcceptConnectionRequest,
  useCancelConnectionRequest,
  useRejectConnectionRequest,
  useRemoveConnection,
  useSendConnectionRequest,
} from "../hooks"
import type { ConnectionItem, InvitationItem, NetworkUserCard } from "../types"

function filterByKeyword<T extends { displayName: string; headline: string | null; location: string | null }>(
  items: T[],
  query: string,
): T[] {
  if (!query.trim()) return items
  const lower = query.toLowerCase().trim()
  return items.filter(
    (item) =>
      item.displayName.toLowerCase().includes(lower) ||
      item.headline?.toLowerCase().includes(lower) ||
      item.location?.toLowerCase().includes(lower),
  )
}

export function NetworkTabs({
  suggestions,
  connections,
  incoming,
  outgoing,
}: {
  suggestions: NetworkUserCard[]
  connections: ConnectionItem[]
  incoming: InvitationItem[]
  outgoing: InvitationItem[]
}) {
  const t = useTranslations("network")
  const [tab, setTab] = useState("suggestions")
  const [suggestionQuery, setSuggestionQuery] = useState("")
  const [connectionQuery, setConnectionQuery] = useState("")

  const filteredSuggestions = useMemo(
    () => filterByKeyword(suggestions, suggestionQuery),
    [suggestions, suggestionQuery],
  )

  const filteredConnections = useMemo(
    () => filterByKeyword(connections, connectionQuery),
    [connections, connectionQuery],
  )

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-6">
      <div>
        <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10 h-10 rounded-xl bg-muted/50 border-border/30 text-sm focus:bg-card"
          placeholder={t("searchPlaceholder")}
          value={suggestionQuery}
          onChange={(event) => setSuggestionQuery(event.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto">
          <TabsTrigger
            value="suggestions"
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            {t("tabs.suggestions")}
          </TabsTrigger>
          <TabsTrigger
            value="connections"
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            {t("tabs.connections")} ({connections.length})
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            {t("tabs.invitations")}
            {incoming.length > 0 ? ` (${incoming.length})` : ""}
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            {t("tabs.sent")}
            {outgoing.length > 0 ? ` (${outgoing.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-5 focus-visible:outline-none">
          <SuggestionsTab
            items={filteredSuggestions}
            isFiltered={suggestionQuery.length > 0}
          />
        </TabsContent>

        <TabsContent value="connections" className="mt-5 focus-visible:outline-none">
          <ConnectionsTab
            items={filteredConnections}
            total={connections.length}
            query={connectionQuery}
            onQueryChange={setConnectionQuery}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-5 focus-visible:outline-none">
          <IncomingTab items={incoming} onExplore={() => setTab("suggestions")} />
        </TabsContent>

        <TabsContent value="sent" className="mt-5 focus-visible:outline-none">
          <OutgoingTab items={outgoing} onExplore={() => setTab("suggestions")} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SuggestionsTab({
  items,
  isFiltered,
}: {
  items: NetworkUserCard[]
  isFiltered: boolean
}) {
  const t = useTranslations("network.suggestions")

  if (items.length === 0) {
    return (
      <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
        <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="font-headline font-bold text-base text-foreground">
          {isFiltered ? t("notFoundTitle") : t("emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isFiltered ? t("notFoundDesc") : t("emptyDesc")}
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <div key={item.userId}>
          <SuggestionCard item={item} />
        </div>
      ))}
    </div>
  )
}

function SuggestionCard({ item }: { item: NetworkUserCard }) {
  const tButton = useTranslations("network.button")
  const send = useSendConnectionRequest()
  return (
    <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all h-full group">
      <div className="flex flex-col items-center text-center gap-1.5 h-full">
        <Link href={`/profile/${item.userId}`}>
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-border/20 cursor-pointer group-hover:ring-2 group-hover:ring-primary/30 transition-all">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
            <AvatarFallback className="text-xs sm:text-sm">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Link
          href={`/profile/${item.userId}`}
          className="font-semibold text-xs sm:text-sm text-foreground hover:text-primary transition-colors leading-tight line-clamp-1 mt-0.5"
        >
          {item.displayName}
        </Link>
        {item.headline ? (
          <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-1">
            {item.headline}
          </p>
        ) : null}
        {item.location ? (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
        ) : null}

        <div className="flex gap-1.5 mt-auto pt-2 w-full">
          <Button
            size="sm"
            className="flex-1 h-8 rounded-lg text-[10px] sm:text-xs"
            disabled={send.isPending}
            onClick={() => send.mutate(item.userId)}
          >
            <UserPlus className="w-3 h-3 mr-1" />
            {send.isPending ? tButton("sending") : tButton("connect")}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function ConnectionsTab({
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
      <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
        <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="font-headline font-bold text-base text-foreground">
          {t("emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{t("emptyDesc")}</p>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/30 flex items-center justify-between gap-3">
        <h2 className="font-headline font-bold text-sm sm:text-base text-foreground">
          {t("allTitle")}{" "}
          <span className="text-muted-foreground font-normal">({total})</span>
        </h2>
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 rounded-lg bg-muted/50 border-none text-xs"
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
        <div className="divide-y divide-border/20">
          {items.map((item) => (
            <ConnectionRow key={item.connectionId} item={item} />
          ))}
        </div>
      )}
    </Card>
  )
}

function ConnectionRow({ item }: { item: ConnectionItem }) {
  const t = useTranslations("network.connections")
  const tButton = useTranslations("network.button")
  const remove = useRemoveConnection()

  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-muted/20 transition-colors">
      <Link href={`/profile/${item.userId}`}>
        <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border border-border/20 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
          {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
          <AvatarFallback className="text-xs">
            {getInitials(item.displayName)}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${item.userId}`}
          className="font-semibold text-sm text-foreground hover:text-primary transition-colors block truncate"
        >
          {item.displayName}
        </Link>
        {item.headline ? (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
            <Building2 className="w-3 h-3 shrink-0" /> {item.headline}
          </p>
        ) : null}
        {item.location ? (
          <p className="text-[11px] text-muted-foreground/70 flex items-center mt-0.5">
            <MapPin className="w-3 h-3 mr-0.5" /> {item.location}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-xs px-2.5"
          disabled={remove.isPending}
          onClick={() => {
            if (window.confirm(t("removeConfirm", { name: item.displayName }))) {
              remove.mutate(item.connectionId)
            }
          }}
        >
          <UserMinus className="w-3.5 h-3.5 sm:mr-1" />
          <span className="hidden sm:inline">
            {remove.isPending ? tButton("removing") : t("removeAction")}
          </span>
        </Button>
      </div>
    </div>
  )
}

function IncomingTab({
  items,
  onExplore,
}: {
  items: InvitationItem[]
  onExplore: () => void
}) {
  const t = useTranslations("network.invitations")

  if (items.length === 0) {
    return (
      <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <h3 className="font-headline font-bold text-base sm:text-lg text-foreground">
          {t("emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          {t("emptyDesc")}
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-lg text-sm"
          onClick={onExplore}
        >
          <UserPlus className="w-4 h-4 mr-1.5" /> {t("explore")}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.connectionId}>
          <IncomingCard item={item} />
        </div>
      ))}
    </div>
  )
}

function IncomingCard({ item }: { item: InvitationItem }) {
  const t = useTranslations("network.invitations")
  const accept = useAcceptConnectionRequest()
  const reject = useRejectConnectionRequest()
  const isBusy = accept.isPending || reject.isPending

  return (
    <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href={`/profile/${item.userId}`}>
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/20 cursor-pointer">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
            <AvatarFallback className="text-xs">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${item.userId}`}
            className="font-semibold text-sm sm:text-base text-foreground truncate hover:text-primary transition-colors block"
          >
            {item.displayName}
          </Link>
          {item.headline ? (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {item.headline}
            </p>
          ) : null}
          {item.location ? (
            <p className="text-[11px] text-muted-foreground/70 flex items-center mt-0.5">
              <MapPin className="w-3 h-3 mr-0.5" /> {item.location}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            className="h-8 sm:h-9 rounded-lg text-xs px-3"
            disabled={isBusy}
            onClick={() => accept.mutate(item.connectionId)}
          >
            <Check className="w-3.5 h-3.5 mr-1" /> {t("accept")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 rounded-lg text-xs px-3"
            disabled={isBusy}
            onClick={() => reject.mutate(item.connectionId)}
          >
            <X className="w-3.5 h-3.5 mr-1" /> {t("reject")}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function OutgoingTab({
  items,
  onExplore,
}: {
  items: InvitationItem[]
  onExplore: () => void
}) {
  const t = useTranslations("network.sent")
  const tInv = useTranslations("network.invitations")

  if (items.length === 0) {
    return (
      <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <h3 className="font-headline font-bold text-base sm:text-lg text-foreground">
          {t("emptyTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          {t("emptyDesc")}
        </p>
        <Button
          variant="outline"
          className="mt-4 rounded-lg text-sm"
          onClick={onExplore}
        >
          <UserPlus className="w-4 h-4 mr-1.5" /> {tInv("explore")}
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.connectionId}>
          <OutgoingCard item={item} />
        </div>
      ))}
    </div>
  )
}

function OutgoingCard({ item }: { item: InvitationItem }) {
  const t = useTranslations("network.sent")
  const tButton = useTranslations("network.button")
  const cancel = useCancelConnectionRequest()

  return (
    <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/30 transition-all">
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href={`/profile/${item.userId}`}>
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/20 cursor-pointer">
            {item.avatarUrl ? <AvatarImage src={item.avatarUrl} /> : null}
            <AvatarFallback className="text-xs">
              {getInitials(item.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${item.userId}`}
            className="font-semibold text-sm sm:text-base text-foreground truncate hover:text-primary transition-colors block"
          >
            {item.displayName}
          </Link>
          {item.headline ? (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {item.headline}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 sm:h-9 rounded-lg text-xs px-3"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(item.connectionId)}
          >
            <X className="w-3.5 h-3.5 mr-1" />
            {cancel.isPending ? tButton("canceling") : t("cancel")}
          </Button>
        </div>
      </div>
    </Card>
  )
}
