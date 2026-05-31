"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Check,
  Eye,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react"

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

import { useDeleteCv, useRenameCv, useSetDefaultCv } from "../hooks"
import { CV_FILE_NAME_MAX } from "../lib/constants"
import type { MemberCv } from "../types"
import { CvViewerDialog } from "./cv-viewer-dialog"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Style đồng bộ với header/profile dropdown: KHÔNG border, KHÔNG shadow.
// Hover: bg-muted nhẹ. Buttons text-only với icon, rounded-lg.
export function CvCard({ cv }: { cv: MemberCv }) {
  const t = useTranslations("cvs")
  const setDefault = useSetDefaultCv()
  const remove = useDeleteCv()
  const rename = useRenameCv()
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [name, setName] = useState(cv.fileName)

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/60 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors line-clamp-1 text-left"
          >
            {cv.fileName}
          </button>
          {cv.isDefault ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              <Star className="w-3 h-3 fill-current" /> {t("default")}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {formatBytes(cv.fileSize)} · {formatDate(cv.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="h-8 px-2 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> {t("view")}
        </button>
        {!cv.isDefault ? (
          <button
            type="button"
            onClick={() => setDefault.mutate(cv.id)}
            disabled={setDefault.isPending}
            className="h-8 px-2 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            {setDefault.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{t("setDefault")}</span>
          </button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-48 p-1.5 rounded-2xl bg-background/95 backdrop-blur-2xl"
          >
            <DropdownMenuItem
              onClick={() => {
                setName(cv.fileName)
                setRenameOpen(true)
              }}
              className="cursor-pointer rounded-xl py-2 px-3 focus:bg-muted"
            >
              <Pencil className="w-4 h-4 text-muted-foreground mr-2.5 shrink-0" />
              <span className="text-sm font-medium">{t("rename")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/30" />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              className="cursor-pointer rounded-xl py-2 px-3 focus:bg-destructive/10 text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2.5 shrink-0" />
              <span className="text-sm font-medium">{t("delete")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CvViewerDialog
        kind="member"
        cvId={cv.id}
        title={cv.fileName}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />

      <Dialog
        open={renameOpen}
        onOpenChange={(o) => (rename.isPending ? null : setRenameOpen(o))}
      >
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
          <DialogFooter className="gap-1">
            <button
              type="button"
              onClick={() => setRenameOpen(false)}
              disabled={rename.isPending}
              className="h-9 px-3 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-60"
            >
              {t("uploadDialog.cancel")}
            </button>
            <button
              type="button"
              disabled={rename.isPending || !name.trim()}
              onClick={() =>
                rename.mutate(
                  { id: cv.id, fileName: name.trim() },
                  { onSuccess: () => setRenameOpen(false) },
                )
              }
              className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-60"
            >
              {rename.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {t("renameDialog.save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => (remove.isPending ? null : setDeleteOpen(o))}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{t("deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("deleteDialog.description", { name: cv.fileName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-1">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={remove.isPending}
              className="h-9 px-3 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-60"
            >
              {t("uploadDialog.cancel")}
            </button>
            <button
              type="button"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(cv.id, { onSuccess: () => setDeleteOpen(false) })
              }
              className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-60"
            >
              {remove.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {t("delete")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
