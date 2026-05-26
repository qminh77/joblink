"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Loader2, Search, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
  const [provinceId, setProvinceId] = useState<number | null>(null)
  const [typeIds, setTypeIds] = useState<number[]>([])
  const [modeIds, setModeIds] = useState<number[]>([])
  const [page, setPage] = useState(0)
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  const query = useJobsList({
    search,
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("heading")}</h1>
          <p className="text-sm text-muted-foreground">{t("subheading")}</p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg lg:hidden"
          onClick={() => setShowFiltersMobile((v) => !v)}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside
          className={`lg:col-span-3 ${
            showFiltersMobile ? "block" : "hidden lg:block"
          }`}
        >
          <Card className="bg-card border-border/30 rounded-xl p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground text-sm">
                {t("filters")}
              </h2>
              {hasFilters ? (
                <button
                  onClick={clearAll}
                  className="text-xs text-primary hover:opacity-80"
                >
                  {t("clearFilters")}
                </button>
              ) : null}
            </div>

            <div className="mb-5">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("location")}
              </h3>
              <select
                value={provinceId ?? ""}
                onChange={(e) => {
                  setProvinceId(e.target.value ? Number(e.target.value) : null)
                  setPage(0)
                }}
                className="w-full h-10 px-3 bg-muted/40 border border-border/30 rounded-lg text-sm focus:outline-none focus:border-primary text-foreground"
              >
                <option value="">{t("allLocations")}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder={t("searchPlaceholder")}
              className="pl-12 h-12 rounded-xl bg-card border-border/30 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t("resultCount", { count: data.total })}
            </p>
            {query.isFetching ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          {data.items.length === 0 ? (
            <Card className="bg-card border-border/30 rounded-xl p-12 text-center">
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
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || query.isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t("prevPage")}
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {t("pagination", { current: page + 1, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1 || query.isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("nextPage")}
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
