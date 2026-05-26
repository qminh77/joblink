"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  createLookup,
  deleteLookup,
  updateLookup,
} from "@/features/admin/api/lookups"
import type {
  AdminLookupKind,
  AdminLookupRow,
} from "@/features/admin/types"

const TAB_ORDER: AdminLookupKind[] = [
  "provinces",
  "districts",
  "job_types",
  "work_modes",
  "job_positions",
  "report_types",
  "skills",
]

type Editing = AdminLookupRow & { __new?: boolean }

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
  const tTabs = useTranslations("admin.lookups.tabs")
  const tErrors = useTranslations("admin.lookups.errors")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Editing | null>(null)

  const kind = initialKind
  const rows = data[kind] ?? []
  const provinces = data.provinces ?? []
  const jobPositions = data.job_positions ?? []
  const isSkills = kind === "skills"

  const setKind = (next: string) => {
    const sp = new URLSearchParams(searchParams.toString())
    sp.set("kind", next)
    startTransition(() => router.replace(`/admin/lookups?${sp.toString()}`))
  }

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

      <Tabs value={kind} onValueChange={setKind}>
        <TabsList className="bg-muted/60 p-1 rounded-xl flex-wrap">
          {TAB_ORDER.map((k) => (
            <TabsTrigger key={k} value={k} className="rounded-lg text-sm px-3">
              {tTabs(k)}{" "}
              <span className="ml-1 text-xs opacity-70">
                ({data[k]?.length ?? 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={kind} className="mt-4">
          <Card className="bg-card border-border/30 rounded-xl overflow-hidden p-0">
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
                    {kind === "districts" ? (
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
                        {kind === "districts" ? (
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
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing?.__new ? t("add") : t("edit")} — {tTabs(kind)}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3">
              {!isSkills ? (
                <Labeled label={t("code")}>
                  <Input
                    value={editing.code}
                    onChange={(e) =>
                      setEditing({ ...editing, code: e.target.value })
                    }
                  />
                </Labeled>
              ) : null}
              <Labeled label={t("name")}>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </Labeled>
              {!isSkills ? (
                <Labeled label={t("nameEn")}>
                  <Input
                    value={editing.nameEn ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, nameEn: e.target.value })
                    }
                  />
                </Labeled>
              ) : null}
              {kind === "districts" ? (
                <Labeled label={t("province")}>
                  <Select
                    value={
                      editing.provinceId != null
                        ? String(editing.provinceId)
                        : ""
                    }
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        provinceId: v ? Number(v) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Labeled>
              ) : null}
              {kind === "job_positions" ? (
                <Labeled label={t("parent")}>
                  <Select
                    value={editing.parentId != null ? String(editing.parentId) : "0"}
                    onValueChange={(v) =>
                      setEditing({
                        ...editing,
                        parentId: v && v !== "0" ? Number(v) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t("noneParent")}</SelectItem>
                      {jobPositions
                        .filter((p) => p.id !== editing.id)
                        .map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Labeled>
              ) : null}
              {!isSkills ? (
                <>
                  <Labeled label={t("sortOrder")}>
                    <Input
                      type="number"
                      value={editing.sortOrder}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          sortOrder: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </Labeled>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t("isActive")}</span>
                    <Switch
                      checked={editing.isActive}
                      onCheckedChange={(v) =>
                        setEditing({ ...editing, isActive: !!v })
                      }
                    />
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={pending}
            >
              {t("cancel")}
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Labeled({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}
