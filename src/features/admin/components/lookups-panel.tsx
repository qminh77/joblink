"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  createLookup,
  deleteLookup,
  updateLookup,
} from "@/features/admin/api/lookups"
import type {
  AdminLookupKind,
  AdminLookupRow,
} from "@/features/admin/types"

import { type EditingLookup, LookupDialog } from "./lookups/lookup-dialog"

const ERROR_KEY_MAP: Record<string, string> = {
  code_required: "admin.lookups.errors.code_required",
  province_required: "admin.lookups.errors.province_required",
}

export function LookupsPanel({
  initialKind,
  data,
}: {
  initialKind: AdminLookupKind
  data: Record<AdminLookupKind, AdminLookupRow[]>
}) {
  const t = useTranslations("admin.lookups")
  const tErrors = useTranslations("admin.lookups.errors")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<EditingLookup | null>(null)

  const kind = initialKind
  const rows = data[kind] ?? []
  const provinces = data.provinces ?? []
  const jobPositions = data.job_positions ?? []
  const isSkills = kind === "skills"

  const openCreate = () => {
    setEditing({
      __new: true,
      id: 0,
      code: "",
      name: "",
      nameEn: "",
      sortOrder: 0,
      isActive: true,
      provinceId: null,
      parentId: null,
    })
  }

  const reportError = (message?: string) => {
    if (!message) {
      toast.error(tCommon("unknownError"))
      return
    }
    const i18nKey = ERROR_KEY_MAP[message]
    if (i18nKey) {
      const k = i18nKey.replace("admin.lookups.errors.", "") as keyof Record<
        string,
        string
      >
      try {
        toast.error(tErrors(k as never))
        return
      } catch {
        // fall through
      }
    }
    toast.error(message)
  }

  const submit = async () => {
    if (!editing) return
    if (!editing.name.trim()) {
      toast.error(tCommon("required"))
      return
    }
    startTransition(async () => {
      const payload = {
        kind,
        code: isSkills ? null : editing.code,
        name: editing.name,
        nameEn: editing.nameEn?.trim() || null,
        sortOrder: Number(editing.sortOrder) || 0,
        isActive: !!editing.isActive,
        provinceId: editing.provinceId ?? null,
        parentId: editing.parentId ?? null,
      }
      const result = editing.__new
        ? await createLookup(payload)
        : await updateLookup({ ...payload, id: editing.id })
      if (!result.ok) {
        reportError(result.error)
        return
      }
      toast.success(
        editing.__new ? t("success.created") : t("success.updated"),
      )
      setEditing(null)
      router.refresh()
    })
  }

  const remove = (row: AdminLookupRow) => {
    if (!confirm(t("confirmDelete"))) return
    startTransition(async () => {
      const result = await deleteLookup({ kind, id: row.id })
      if (!result.ok) {
        reportError(result.error)
        return
      }
      toast.success(t("success.deleted"))
      router.refresh()
    })
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={openCreate} disabled={pending} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t("add")}
        </Button>
      </header>

      <div className="mt-6">
        <Card className="bg-transparent border-none shadow-none rounded-xl overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20">
                    {!isSkills ? (
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("code")}
                      </th>
                    ) : null}
                    <th className="text-left px-4 py-3 font-semibold">
                      {t("name")}
                    </th>
                    {!isSkills ? (
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("nameEn")}
                      </th>
                    ) : null}
                    {kind === "wards" ? (
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("province")}
                      </th>
                    ) : null}
                    {kind === "job_positions" ? (
                      <th className="text-left px-4 py-3 font-semibold">
                        {t("parent")}
                      </th>
                    ) : null}
                    {!isSkills ? (
                      <>
                        <th className="text-left px-4 py-3 font-semibold">
                          {t("sortOrder")}
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">
                          {t("isActive")}
                        </th>
                      </>
                    ) : null}
                    <th className="text-right px-4 py-3 font-semibold">
                      {tCommon("edit")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center text-muted-foreground py-12"
                      >
                        {t("empty")}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/20">
                        {!isSkills ? (
                          <td className="px-4 py-3 font-mono text-xs">
                            {row.code}
                          </td>
                        ) : null}
                        <td className="px-4 py-3">{row.name}</td>
                        {!isSkills ? (
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.nameEn ?? "—"}
                          </td>
                        ) : null}
                        {kind === "wards" ? (
                          <td className="px-4 py-3 text-muted-foreground">
                            {provinces.find((p) => p.id === row.provinceId)
                              ?.name ?? "—"}
                          </td>
                        ) : null}
                        {kind === "job_positions" ? (
                          <td className="px-4 py-3 text-muted-foreground">
                            {jobPositions.find((p) => p.id === row.parentId)
                              ?.name ?? "—"}
                          </td>
                        ) : null}
                        {!isSkills ? (
                          <>
                            <td className="px-4 py-3 text-muted-foreground">
                              {row.sortOrder}
                            </td>
                            <td className="px-4 py-3">
                              {row.isActive ? (
                                <Badge variant="outline" className="text-xs">
                                  ✓
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  —
                                </span>
                              )}
                              {row.isSystem ? (
                                <Badge
                                  variant="outline"
                                  className="ml-1 text-[10px]"
                                >
                                  {t("isSystem")}
                                </Badge>
                              ) : null}
                            </td>
                          </>
                        ) : null}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={pending}
                              onClick={() =>
                                setEditing({
                                  ...row,
                                  nameEn: row.nameEn ?? "",
                                })
                              }
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {!row.isSystem ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500"
                                disabled={pending}
                                onClick={() => remove(row)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
      </div>

      <LookupDialog
        editing={editing}
        setEditing={setEditing}
        submit={submit}
        pending={pending}
        kind={kind}
        isSkills={isSkills}
        provinces={provinces}
        jobPositions={jobPositions}
      />
    </>
  )
}
