"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import {
  createReportType,
  deleteReportType,
  updateReportType,
  type ReportTypeRow,
} from "@/features/admin/api/report-types"

type Editing = {
  __new?: boolean
  id: number
  code: string
  name: string
  nameEn: string
  sortOrder: number
  isActive: boolean
}

export function ReportTypesPanel({ items }: { items: ReportTypeRow[] }) {
  const t = useTranslations("admin.reportTypes")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editing, setEditing] = useState<Editing | null>(null)

  const openCreate = () => {
    setEditing({
      __new: true,
      id: 0,
      code: "",
      name: "",
      nameEn: "",
      sortOrder: 0,
      isActive: true,
    })
  }

  const submit = async () => {
    if (!editing) return
    if (!editing.code.trim() || !editing.name.trim()) {
      toast.error(tCommon("required"))
      return
    }
    startTransition(async () => {
      const payload = {
        code: editing.code.trim(),
        name: editing.name.trim(),
        nameEn: editing.nameEn?.trim() || null,
        sortOrder: Number(editing.sortOrder) || 0,
        isActive: !!editing.isActive,
      }
      const result = editing.__new
        ? await createReportType(payload)
        : await updateReportType({ ...payload, id: editing.id })
      if (!result.ok) {
        toast.error(result.error === "cannot_delete_system" ? t("cannotDeleteSystem") : result.error)
        return
      }
      toast.success(editing.__new ? t("success.created") : t("success.updated"))
      setEditing(null)
      router.refresh()
    })
  }

  const remove = (row: ReportTypeRow) => {
    if (!confirm(t("confirmDelete"))) return
    startTransition(async () => {
      const result = await deleteReportType(row.id)
      if (!result.ok) {
        toast.error(result.error === "cannot_delete_system" ? t("cannotDeleteSystem") : result.error)
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

      <Card className="bg-card border-border/30 rounded-xl overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/20">
                <th className="text-left px-4 py-3 font-semibold">{t("code")}</th>
                <th className="text-left px-4 py-3 font-semibold">{t("name")}</th>
                <th className="text-left px-4 py-3 font-semibold">{t("nameEn")}</th>
                <th className="text-left px-4 py-3 font-semibold">{t("sortOrder")}</th>
                <th className="text-left px-4 py-3 font-semibold">{t("isActive")}</th>
                <th className="text-right px-4 py-3 font-semibold">{tCommon("edit")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-12">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{row.code}</td>
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.nameEn ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.sortOrder}</td>
                    <td className="px-4 py-3">
                      {row.isActive ? (
                        <Badge variant="outline" className="text-xs">
                          ✓
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                      {row.isSystem ? (
                        <Badge variant="outline" className="ml-1 text-[10px]">
                          <ShieldCheck className="w-3 h-3 mr-0.5 inline" />
                          {t("isSystem")}
                        </Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={pending}
                          onClick={() =>
                            setEditing({
                              id: row.id,
                              code: row.code,
                              name: row.name,
                              nameEn: row.nameEn ?? "",
                              sortOrder: row.sortOrder,
                              isActive: row.isActive,
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

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing?.__new ? t("add") : t("edit")}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("code")}</label>
                <Input
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("name")}</label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("nameEn")}</label>
                <Input
                  value={editing.nameEn ?? ""}
                  onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{t("sortOrder")}</label>
                <Input
                  type="number"
                  value={editing.sortOrder}
                  onChange={(e) =>
                    setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("isActive")}</span>
                <Switch
                  checked={editing.isActive}
                  onCheckedChange={(v) => setEditing({ ...editing, isActive: !!v })}
                />
              </div>
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
