"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { applyCompanyAction } from "../../api/companies"
import type { AdminCompanyRow } from "../../types"
import { TAB_STATUS, type CompanyAction } from "./constants"

type ConfirmTarget = {
  company: AdminCompanyRow
  action: CompanyAction
}

export function useCompaniesPanel({
  query,
}: {
  query: { status?: string; search?: string }
}) {
  const t = useTranslations("admin.companies")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(query.search ?? "")
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  const tab = query.status && TAB_STATUS[query.status] ? query.status : "pending"

  function setTab(value: string) {
    const next = new URLSearchParams(searchParams.toString())
    if (value === "all") next.delete("status")
    else next.set("status", value)
    startTransition(() =>
      router.replace(`/admin/companies?${next.toString()}`),
    )
  }

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const next = new URLSearchParams(searchParams.toString())
    if (search.trim()) next.set("q", search.trim())
    else next.delete("q")
    startTransition(() =>
      router.replace(`/admin/companies?${next.toString()}`),
    )
  }

  function openConfirm(company: AdminCompanyRow, action: CompanyAction) {
    setConfirmTarget({ company, action })
  }

  function closeConfirm() {
    setConfirmTarget(null)
    setNote("")
  }

  function submit() {
    if (!confirmTarget) return
    if (confirmTarget.action === "reject" && !note.trim()) {
      toast.error(t("note"))
      return
    }

    startTransition(async () => {
      const result = await applyCompanyAction({
        userId: confirmTarget.company.userId,
        action: confirmTarget.action,
        note: note.trim() || null,
      })
      if (!result.ok) {
        toast.error(tCommon("unknownError"))
        return
      }

      toast.success(t(successKey(confirmTarget.action) as never))
      closeConfirm()
      router.refresh()
    })
  }

  return {
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
  }
}

function successKey(action: CompanyAction) {
  if (action === "approve") return "success.approved"
  if (action === "reject") return "success.rejected"
  if (action === "suspend") return "success.suspended"
  return "success.restored"
}
