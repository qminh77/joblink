"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Download, FileText, Loader2, MoreVertical, Pencil, Star, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate } from "@/lib/utils/format"

import {
  useDeleteCv,
  useRenameCv,
  useSetDefaultCv,
} from "../hooks"
import { getCvViewUrlAction } from "../api/actions"
import { CV_FILE_NAME_MAX } from "../lib/constants"
import type { MemberCv } from "../types"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CvCard({ cv }: { cv: MemberCv }) {
  const t = useTranslations("cvs")
  const setDefault = useSetDefaultCv()
  const remove = useDeleteCv()
  const rename = useRenameCv()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [name, setName] = useState(cv.fileName)
  const [viewing, setViewing] = useState(false)

  async function openCv() {
    setViewing(true)
    try {
      const res = await getCvViewUrlAction({ cvId: cv.id })
      if (res.ok) {
        window.open(res.data.url, "_blank", "noopener,noreferrer")
      }
    } finally {
      setViewing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4 flex gap-3 items-start hover:border-primary/40 transition">
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1">
            {cv.fileName}
          </h3>
          {cv.isDefault ? (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Star className="w-3 h-3 fill-current" /> {t("default")}
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatBytes(cv.fileSize)} · {formatDate(cv.createdAt)}
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg"
            onClick={openCv}
            disabled={viewing}
          >
            {viewing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 mr-1.5" />
            )}
            {t("view")}
          </Button>
          {!cv.isDefault ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-lg"
              onClick={() => setDefault.mutate(cv.id)}
              disabled={setDefault.isPending}
            >
              <Check className="w-3.5 h-3.5 mr-1.5" /> {t("setDefault")}
            </Button>
          ) : null}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem
            onClick={() => {
              setName(cv.fileName)
              setRenameOpen(true)
            }}
          >
            <Pencil className="w-4 h-4 mr-2" /> {t("rename")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" /> {t("delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={(o) => (rename.isPending ? null : setRenameOpen(o))}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{t("renameDialog.title")}</DialogTitle>
            <DialogDescription>{t("renameDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label className="text-sm">{t("uploadDialog.nameLabel")}</Label>
            <Input
              value={name}
              maxLength={CV_FILE_NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setRenameOpen(false)}
              disabled={rename.isPending}
            >
              {t("uploadDialog.cancel")}
            </Button>
            <Button
              className="rounded-xl"
              disabled={rename.isPending || !name.trim()}
              onClick={() =>
                rename.mutate(
                  { id: cv.id, fileName: name.trim() },
                  { onSuccess: () => setRenameOpen(false) },
                )
              }
            >
              {rename.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {t("renameDialog.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(o) => (remove.isPending ? null : setDeleteOpen(o))}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>{t("deleteDialog.description", { name: cv.fileName })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDeleteOpen(false)}
              disabled={remove.isPending}
            >
              {t("uploadDialog.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(cv.id, { onSuccess: () => setDeleteOpen(false) })
              }
            >
              {remove.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
