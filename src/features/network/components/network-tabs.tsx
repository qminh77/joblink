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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import {
  useAcceptConnectionRequest,
  useCancelConnectionRequest,
  useNetworkOverview,
  useRealtimeConnections,
  useRejectConnectionRequest,
  useRemoveConnection,
  useSendConnectionRequest,
  useSentConnectionIds,
} from "../hooks"
import type {
  ConnectionItem,
  InvitationItem,
  NetworkOverview,
  NetworkUserCard,
} from "../types"

function filterByKeyword<
  T extends {
    displayName: string
    headline: string | null
    location: string | null
  },
>(items: T[], query: string): T[] {
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
  initialOverview,
}: {
  initialOverview: NetworkOverview
}) {
  const t = useTranslations("network")
  const currentUser = useCurrentUser()
  const { data } = useNetworkOverview(initialOverview)
  useRealtimeConnections(currentUser.id)

  const overview = data ?? initialOverview
  const { suggestions, connections, incoming, outgoing } = overview

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
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-10 h-10 rounded-xl"
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

// -- Empty / placeholder card --------------------------------------------
function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Users
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Card className="p-8 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        <Icon className="size-6 text-muted-foreground/60" />
      </div>
      <h3 className="font-headline font-bold text-base text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}

// -- SUGGESTIONS ----------------------------------------------------------
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

// -- CONNECTIONS ----------------------------------------------------------
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
            className="pl-8 h-8 rounded-lg text-xs"
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

// -- INVITATIONS (incoming) ----------------------------------------------
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
        <div className="flex gap-2 shrink-0">
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

// -- SENT (outgoing) ------------------------------------------------------
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
      <EmptyStateCard
        icon={Users}
        title={t("emptyTitle")}
        description={t("emptyDesc")}
        action={
          <Button variant="ghost" size="sm" onClick={onExplore}>
            <UserPlus /> {tInv("explore")}
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <OutgoingCard key={item.connectionId} item={item} />
      ))}
    </div>
  )
}

function OutgoingCard({ item }: { item: InvitationItem }) {
  const t = useTranslations("network.sent")
  const tButton = useTranslations("network.button")
  const cancel = useCancelConnectionRequest()

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
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={cancel.isPending}
          onClick={() => cancel.mutate(item.connectionId)}
        >
          <X />
          {cancel.isPending ? tButton("canceling") : t("cancel")}
        </Button>
      </div>
    </Card>
  )
}

// -- Confirm dialog -------------------------------------------------------
function RemoveConnectionDialog({
  displayName,
  isPending,
  onConfirm,
  children,
}: {
  displayName: string
  isPending: boolean
  onConfirm: () => void
  children: React.ReactNode
}) {
  const t = useTranslations("network.connections.removeDialog")
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { name: displayName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={onConfirm}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
