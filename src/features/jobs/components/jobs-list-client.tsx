"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Loader2, Search, SlidersHorizontal } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SearchSelect } from "@/components/ui/search-select"
import { fadeUp, staggerSm } from "@/lib/animations"
import type { ProvinceRow } from "@/types/database"

import { useJobsList } from "../hooks"
import type {
  JobTypeRef,
  JobsListPage,
  WorkModeRef,
} from "../types"

import { JobCard } from "./job-card"

type Props = {
  provinces: ProvinceRow[]
  jobTypes: JobTypeRef[]
  workModes: WorkModeRef[]
  initialPage: JobsListPage
}

const PAGE_SIZE = 20

export function JobsListClient({
  provinces,
  jobTypes,
  workModes,
  initialPage,
}: Props) {
  const t = useTranslations("jobs.public")

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [provinceId, setProvinceId] = useState<number | null>(null)
  const [typeIds, setTypeIds] = useState<number[]>([])
  const [modeIds, setModeIds] = useState<number[]>([])
  const [page, setPage] = useState(0)
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const query = useJobsList({
    search: debouncedSearch,
    provinceId,
    jobTypeIds: typeIds,
    workModeIds: modeIds,
    offset: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    initialData: page === 0 ? initialPage : undefined,
  })

  const data = query.data ?? { items: [], total: 0 }
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  function toggleArr(arr: number[], id: number): number[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]
  }

  function clearAll() {
    setSearch("")
    setProvinceId(null)
    setTypeIds([])
    setModeIds([])
    setPage(0)
  }

  const hasFilters = useMemo(
    () =>
      Boolean(search) ||
      provinceId != null ||
      typeIds.length > 0 ||
      modeIds.length > 0,
    [search, provinceId, typeIds, modeIds],
  )

  // (alertFilters removed — job alerts feature removed)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="font-headline font-bold text-xl text-foreground">
            {t("heading")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("subheading")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowFiltersMobile((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          aria-label={t("filters")}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside
          className={`lg:col-span-3 ${
            showFiltersMobile ? "block" : "hidden lg:block"
          }`}
        >
          <Card className="bg-card border-border/40 rounded-2xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-bold text-foreground text-sm">
                {t("filters")}
              </h2>
              {hasFilters ? (
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 h-7 rounded-lg transition-colors"
                >
                  {t("clearFilters")}
                </button>
              ) : null}
            </div>

            <div className="mb-5">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("location")}
              </h3>
              <SearchSelect
                options={[
                  { value: "", label: t("allLocations") },
                  ...provinces.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                  })),
                ]}
                value={provinceId != null ? String(provinceId) : ""}
                onValueChange={(v) => {
                  setProvinceId(v ? Number(v) : null)
                  setPage(0)
                }}
                placeholder={t("allLocations")}
                searchPlaceholder={t("searchLocation")}
              />
            </div>

            <div className="mb-5">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("jobType")}
              </h3>
              <div className="space-y-2">
                {jobTypes.map((jt) => (
                  <label
                    key={jt.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <Checkbox
                      checked={typeIds.includes(jt.id)}
                      onCheckedChange={() => {
                        setTypeIds((prev) => toggleArr(prev, jt.id))
                        setPage(0)
                      }}
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {jt.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("workMode")}
              </h3>
              <div className="space-y-2">
                {workModes.map((wm) => (
                  <label
                    key={wm.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <Checkbox
                      checked={modeIds.includes(wm.id)}
                      onCheckedChange={() => {
                        setModeIds((prev) => toggleArr(prev, wm.id))
                        setPage(0)
                      }}
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {wm.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </Card>
        </aside>

        <section className="lg:col-span-9 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder={t("searchPlaceholder")}
              className="pl-11 h-10 rounded-full bg-muted border-none text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("resultCount", { count: data.total })}
            </p>
            {query.isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          {data.items.length === 0 ? (
            <Card className="bg-card border-border/40 rounded-2xl p-12 text-center">
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            </Card>
          ) : (
            <motion.div
              variants={staggerSm}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {data.items.map((job) => (
                <motion.div key={job.id} variants={fadeUp}>
                  <JobCard job={job} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-1 pt-2">
              <button
                type="button"
                disabled={page === 0 || query.isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {t("prevPage")}
              </button>
              <span className="text-xs text-muted-foreground px-2">
                {t("pagination", { current: page + 1, total: totalPages })}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1 || query.isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                {t("nextPage")}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
