"use client"

import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
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

import type { AdminLookupKind, AdminLookupRow } from "../../types"

export type EditingLookup = AdminLookupRow & { __new?: boolean }

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

export function LookupDialog({
  editing,
  setEditing,
  submit,
  pending,
  kind,
  isSkills,
  provinces,
  jobPositions,
}: {
  editing: EditingLookup | null
  setEditing: (val: EditingLookup | null) => void
  submit: () => void
  pending: boolean
  kind: AdminLookupKind
  isSkills: boolean
  provinces: AdminLookupRow[]
  jobPositions: AdminLookupRow[]
}) {
  const t = useTranslations("admin.lookups")
  const tTabs = useTranslations("admin.lookups.tabs")

  return (
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
            {kind === "wards" ? (
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
  )
}
