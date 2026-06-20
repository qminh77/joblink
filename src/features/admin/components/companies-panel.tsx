"use client"

import { useTranslations } from "next-intl"

import type { AdminCompanyRow } from "@/features/admin/types"
import type { CompanyVerification } from "@/types/database"
import { CompanyActionDialog } from "./companies-panel/company-action-dialog"
import { CompanyList } from "./companies-panel/company-list"
import { CompanySearch } from "./companies-panel/company-search"
import { CompanyTabs } from "./companies-panel/company-tabs"
import { useCompaniesPanel } from "./companies-panel/use-companies-panel"

export function CompaniesPanel({
  items,
  counts,
  query,
}: {
  items: AdminCompanyRow[]
  counts: Record<CompanyVerification | "all", number>
  query: { status?: string; search?: string }
}) {
  const t = useTranslations("admin.companies")
  const {
    closeConfirm,
    confirmTarget,
    note,
    onSearchSubmit,
    openConfirm,
    pending,
    search,
    setNote,
    setSearch,
    setTab,
    submit,
    tab,
  } = useCompaniesPanel({ query })

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <CompanySearch
        onSearchChange={setSearch}
        onSearchSubmit={onSearchSubmit}
        search={search}
      />

      <CompanyTabs counts={counts} onTabChange={setTab} tab={tab}>
        <CompanyList
          items={items}
          onAction={openConfirm}
          pending={pending}
        />
      </CompanyTabs>

      <CompanyActionDialog
        confirmTarget={confirmTarget}
        note={note}
        onClose={closeConfirm}
        onNoteChange={setNote}
        onSubmit={submit}
        pending={pending}
      />
    </>
  )
}
