"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Loader2, Search } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/lib/utils/use-debounce"

import type { SearchTab } from "../types"
import { useSearchAllTab, useSearchTabResults } from "../hooks"
import { PeopleCard, CompanyCard, JobCard, PostCard } from "./search-cards"

type Props = {
  initialQuery: string
}

const PAGE_SIZE = 20

function SearchSkeleton() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      Searching...
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center">
      <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function SectionHeader({
  label,
  count,
  query,
  tab,
}: {
  label: string
  count: number
  query: string
  tab: SearchTab
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="font-headline font-bold text-sm text-foreground">
        {label}{" "}
        <span className="text-muted-foreground font-normal">({count})</span>
      </h3>
      {count > 3 ? (
        <a
          href={`/search?q=${encodeURIComponent(query)}&tab=${tab}`}
          className="text-xs text-primary hover:underline font-medium"
        >
          See all
        </a>
      ) : null}
    </div>
  )
}

function useTabPagination(
  query: string,
  tab: SearchTab,
  deps?: Record<string, unknown>,
) {
  const [offset, setOffset] = useState(0)
  const [allItems, setAllItems] = useState<unknown[]>([])
  const { data, isFetching } = useSearchTabResults(query, tab, offset, deps)

  useEffect(() => {
    setAllItems([])
    setOffset(0)
  }, [query, JSON.stringify(deps ?? {})])

  useEffect(() => {
    if (data && "items" in data) {
      const newItems = (data as { items: unknown[] }).items
      setAllItems((prev) => {
        const seen = new Set(
          prev.map((i) => (i as Record<string, unknown>).id),
        )
        const deduped = newItems.filter(
          (i) => !seen.has((i as Record<string, unknown>).id),
        )
        return [...prev, ...deduped]
      })
    }
  }, [data])

  const total = data && "total" in data ? (data as { total: number }).total : 0
  const hasMore = allItems.length < total

  return {
    allItems,
    isFetching,
    hasMore,
    total,
    loadMore: () => setOffset((prev) => prev + PAGE_SIZE),
  }
}

export function SearchPageClient({ initialQuery }: Props) {
  const t = useTranslations("search")
  const tNav = useTranslations("nav")
  const router = useRouter()
  const sp = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<SearchTab>(
    (sp.get("tab") as SearchTab) ?? "all",
  )
  const debouncedQuery = useDebounce(query, 300)

  const allData = useSearchAllTab(debouncedQuery)
  const allResults = allData.data

  const totalAll = useMemo(() => {
    if (!allResults) return 0
    return (
      allResults.people.total +
      allResults.companies.total +
      allResults.jobs.total +
      allResults.posts.total
    )
  }, [allResults])

  useEffect(() => {
    const tab = sp.get("tab") as SearchTab | null
    if (tab && tab !== activeTab) setActiveTab(tab)
  }, [sp, activeTab])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q.length >= 2) {
      const params = new URLSearchParams()
      params.set("q", q)
      if (activeTab !== "all") params.set("tab", activeTab)
      router.push(`/search?${params.toString()}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tNav("searchPlaceholder")}
            className="h-12 pl-12 pr-4 bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl text-base"
          />
        </div>
      </form>

      {debouncedQuery.length < 2 ? (
        <div className="py-20 text-center">
          <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-headline font-bold text-foreground">
            {t("pageTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("typeToSearch")}
          </p>
        </div>
      ) : allData.isFetching && !allResults ? (
        <SearchSkeleton />
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SearchTab)}
        >
          <TabsList className="bg-muted/60 p-1 rounded-xl mb-4 overflow-x-auto w-full justify-start">
            <TabsTrigger value="all" className="rounded-lg text-sm">
              {t("all")}
              {allResults ? ` (${totalAll})` : ""}
            </TabsTrigger>
            <TabsTrigger value="people" className="rounded-lg text-sm">
              {t("people")}
              {allResults ? ` (${allResults.people.total})` : ""}
            </TabsTrigger>
            <TabsTrigger value="companies" className="rounded-lg text-sm">
              {t("companies")}
              {allResults ? ` (${allResults.companies.total})` : ""}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="rounded-lg text-sm">
              {t("jobs")}
              {allResults ? ` (${allResults.jobs.total})` : ""}
            </TabsTrigger>
            <TabsTrigger value="posts" className="rounded-lg text-sm">
              {t("posts")}
              {allResults ? ` (${allResults.posts.total})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {allResults ? (
              <AllTabContent data={allResults} query={debouncedQuery} />
            ) : (
              <EmptyState label={t("noResults")} />
            )}
          </TabsContent>

          <TabsContent value="people" className="mt-0">
            <PaginatedTabContent
              query={debouncedQuery}
              tab="people"
              renderItem={(item: unknown) => (
                <PeopleCard person={item as import("../types").SearchPagePerson} />
              )}
              emptyLabel={t("noResultsTab", { tab: t("people") })}
            />
          </TabsContent>

          <TabsContent value="companies" className="mt-0">
            <PaginatedTabContent
              query={debouncedQuery}
              tab="companies"
              renderItem={(item: unknown) => (
                <CompanyCard
                  company={item as import("../types").SearchPageCompany}
                />
              )}
              emptyLabel={t("noResultsTab", { tab: t("companies") })}
            />
          </TabsContent>

          <TabsContent value="jobs" className="mt-0">
            <PaginatedTabContent
              query={debouncedQuery}
              tab="jobs"
              renderItem={(item: unknown) => (
                <JobCard job={item as import("../types").SearchPageJob} />
              )}
              emptyLabel={t("noResultsTab", { tab: t("jobs") })}
            />
          </TabsContent>

          <TabsContent value="posts" className="mt-0">
            <PaginatedTabContent
              query={debouncedQuery}
              tab="posts"
              renderItem={(item: unknown) => (
                <PostCard post={item as import("../types").SearchPagePost} />
              )}
              emptyLabel={t("noResultsTab", { tab: t("posts") })}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function AllTabContent({
  data,
  query,
}: {
  data: NonNullable<ReturnType<typeof useSearchAllTab>["data"]>
  query: string
}) {
  const t = useTranslations("search")
  const hasAny =
    data.people.total +
      data.companies.total +
      data.jobs.total +
      data.posts.total >
    0

  if (!hasAny) return <EmptyState label={t("noResults")} />

  return (
    <Card className="bg-card border-border/40 rounded-2xl overflow-hidden divide-y divide-border/30">
      {data.people.total > 0 ? (
        <div className="p-4">
          <SectionHeader
            label={t("people")}
            count={data.people.total}
            query={query}
            tab="people"
          />
          <div className="space-y-1">
            {data.people.items.map((p) => (
              <PeopleCard key={`p${p.userId}`} person={p} />
            ))}
          </div>
        </div>
      ) : null}

      {data.companies.total > 0 ? (
        <div className="p-4">
          <SectionHeader
            label={t("companies")}
            count={data.companies.total}
            query={query}
            tab="companies"
          />
          <div className="space-y-1">
            {data.companies.items.map((c) => (
              <CompanyCard key={`c${c.userId}`} company={c} />
            ))}
          </div>
        </div>
      ) : null}

      {data.jobs.total > 0 ? (
        <div className="p-4">
          <SectionHeader
            label={t("jobs")}
            count={data.jobs.total}
            query={query}
            tab="jobs"
          />
          <div className="space-y-1">
            {data.jobs.items.map((j) => (
              <JobCard key={`j${j.id}`} job={j} />
            ))}
          </div>
        </div>
      ) : null}

      {data.posts.total > 0 ? (
        <div className="p-4">
          <SectionHeader
            label={t("posts")}
            count={data.posts.total}
            query={query}
            tab="posts"
          />
          <div className="space-y-1">
            {data.posts.items.map((p) => (
              <PostCard key={`po${p.id}`} post={p} />
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function PaginatedTabContent({
  query,
  tab,
  renderItem,
  emptyLabel,
}: {
  query: string
  tab: SearchTab
  renderItem: (item: unknown) => React.ReactNode
  emptyLabel: string
}) {
  const { allItems, isFetching, hasMore, total, loadMore } =
    useTabPagination(query, tab)

  if (isFetching && allItems.length === 0) {
    return <SearchSkeleton />
  }

  if (allItems.length === 0) {
    return <EmptyState label={emptyLabel} />
  }

  return (
    <Card className="bg-card border-border/40 rounded-2xl overflow-hidden">
      <div className="divide-y divide-border/30">
        {allItems.map((item) => (
          <div key={(item as Record<string, unknown>).id as string} className="px-1">
            {renderItem(item)}
          </div>
        ))}
      </div>
      <LoadMore
        hasMore={hasMore}
        isLoading={isFetching}
        total={total}
        loaded={allItems.length}
        onLoadMore={loadMore}
      />
    </Card>
  )
}

function LoadMore({
  hasMore,
  isLoading,
  total,
  loaded,
  onLoadMore,
}: {
  hasMore: boolean
  isLoading: boolean
  total: number
  loaded: number
  onLoadMore: () => void
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && hasMore && !isLoading) {
            onLoadMore()
          }
        }
      },
      { rootMargin: "400px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  return (
    <div className="py-4 text-center text-xs text-muted-foreground">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : hasMore ? (
        <div ref={sentinelRef}>
          {loaded} / {total} — scroll for more
        </div>
      ) : total > 0 ? (
        <span>Showing all {total} results</span>
      ) : null}
    </div>
  )
}
