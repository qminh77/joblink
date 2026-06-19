"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import {
  useNetworkOverview,
  useRealtimeConnections,
} from "../hooks"
import type { NetworkOverview } from "../types"
import { ConnectionsTab } from "./network-tabs/connections-tab"
import { IncomingTab } from "./network-tabs/incoming-tab"
import { OutgoingTab } from "./network-tabs/outgoing-tab"
import { SuggestionsTab } from "./network-tabs/suggestions-tab"

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
      <div className="pb-2 border-b border-border/40">
        <h1 className="font-headline font-bold text-xl text-foreground">
          {t("title")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-10 h-10 rounded-full bg-muted border-none text-sm"
          placeholder={t("searchPlaceholder")}
          value={suggestionQuery}
          onChange={(event) => setSuggestionQuery(event.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-2xl overflow-x-auto">
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
