"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Briefcase, Building2, Loader2, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import { useGlobalSearch } from "../hooks"

// Tìm kiếm diện rộng trên header: gõ → debounce → dropdown phân nhóm
// (Người dùng / Công ty / Việc làm). Chọn 1 mục thì điều hướng tới hồ sơ/tin.
export function HeaderSearch() {
  const tNav = useTranslations("nav")
  const t = useTranslations("search")
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce 250ms để tránh gọi server mỗi lần gõ.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(id)
  }, [query])

  // Đóng dropdown khi click ra ngoài.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  const { data, isFetching } = useGlobalSearch(debounced)
  const results = data ?? { people: [], companies: [], jobs: [] }
  const hasQuery = debounced.length >= 2
  const total =
    results.people.length + results.companies.length + results.jobs.length
  const showLoading = isFetching && total === 0
  const empty = hasQuery && !isFetching && total === 0

  function go(href: string) {
    setOpen(false)
    setQuery("")
    setDebounced("")
    router.push(href)
  }

  return (
    <div ref={containerRef} className="hidden sm:flex relative items-center group">
      <Search className="absolute left-3 text-muted-foreground size-4 group-focus-within:text-primary transition-colors pointer-events-none z-10" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        placeholder={tNav("searchPlaceholder")}
        type="text"
        className="h-9 pl-9 pr-4 bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary w-48 md:w-64 lg:w-80 rounded-full transition-all text-sm"
      />

      {open && hasQuery ? (
        <div className="absolute top-11 left-0 w-[22rem] max-h-[28rem] overflow-y-auto rounded-2xl bg-background/95 backdrop-blur-2xl border border-border/40 shadow-xl p-2 z-50">
          {showLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("searching")}
            </div>
          ) : empty ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("noResults")}
            </div>
          ) : (
            <>
              {results.people.length > 0 ? (
                <section className="mb-1">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("people")}
                  </p>
                  {results.people.map((p) => (
                    <button
                      key={`u${p.userId}`}
                      type="button"
                      onClick={() => go(profileHref(p.userId, "member"))}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-9 h-9 shrink-0">
                        {p.avatarUrl ? <AvatarImage src={p.avatarUrl} /> : null}
                        <AvatarFallback className="text-xs">
                          {getInitials(p.name, "JL")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {p.name}
                        </span>
                        {p.headline ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.headline}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}

              {results.companies.length > 0 ? (
                <section className="mb-1">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("companies")}
                  </p>
                  {results.companies.map((c) => (
                    <button
                      key={`c${c.userId}`}
                      type="button"
                      onClick={() => go(profileHref(c.userId, "company"))}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-9 h-9 shrink-0 rounded-lg">
                        {c.logoUrl ? <AvatarImage src={c.logoUrl} /> : null}
                        <AvatarFallback className="text-xs rounded-lg">
                          <Building2 className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {c.name}
                        </span>
                        {c.industry ? (
                          <span className="block truncate text-xs text-muted-foreground">
                            {c.industry}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}

              {results.jobs.length > 0 ? (
                <section>
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("jobs")}
                  </p>
                  {results.jobs.map((j) => (
                    <button
                      key={`j${j.id}`}
                      type="button"
                      onClick={() => go(`/jobs/${j.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-muted transition-colors"
                    >
                      <span className="w-9 h-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {j.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {j.companyName}
                        </span>
                      </span>
                    </button>
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
