"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { FileUp, Loader2, UploadCloud } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
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
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import {
  CV_ALLOWED_MIME,
  CV_FILE_NAME_MAX,
  CV_MAX_BYTES,
} from "../lib/constants"
import { useUploadCv } from "../hooks"
import { validateCvFile } from "../lib/upload"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Auto-set CV mới làm default — bật khi gọi từ Easy Apply flow để CV vừa
  // upload xong được chọn ngay.
  forceDefault?: boolean
  onUploaded?: (cvId: number) => void
}

function deriveName(file: File): string {
  const base = file.name.replace(/\.pdf$/i, "")
  return base.slice(0, CV_FILE_NAME_MAX).trim() || "CV"
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// Form state sống trong UploadForm — mount theo DialogContent (Radix portal
// unmount khi close), nên state reset mỗi lần mở dialog mà không cần useEffect.
function UploadForm({
  forceDefault,
  onUploaded,
  onClose,
}: {
  forceDefault?: boolean
  onUploaded?: (cvId: number) => void
  onClose: () => void
}) {
  const t = useTranslations("cvs")
  const current = useCurrentUser()
  const upload = useUploadCv()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState("")
  const [makeDefault, setMakeDefault] = useState<boolean>(Boolean(forceDefault))
  const [localError, setLocalError] = useState<string | null>(null)

  function pickFile(next: File | null) {
    if (!next) {
      setFile(null)
      setLocalError(null)
      return
    }
    const code = validateCvFile(next)
    if (code) {
      setLocalError(t(`upload.${code}`))
      setFile(null)
      return
    }
    setFile(next)
    setFileName(deriveName(next))
    setLocalError(null)
  }

  function submit() {
    if (!file || !current) return
    const name = fileName.trim()
    if (!name) {
      setLocalError(t("validation.fileNameRequired"))
      return
    }
    upload.mutate(
      {
        file,
        fileName: name,
        userId: current.id,
        makeDefault: forceDefault ? true : makeDefault,
      },
      {
        onSuccess: (cv) => {
          onUploaded?.(cv.id)
          onClose()
        },
      },
    )
  }

  const busy = upload.isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline">{t("uploadDialog.title")}</DialogTitle>
        <DialogDescription>
          {t("uploadDialog.description", {
            max: Math.floor(CV_MAX_BYTES / 1024 / 1024),
          })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <input
          ref={inputRef}
          type="file"
          accept={CV_ALLOWED_MIME}
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full bg-muted/40 hover:bg-muted/70 rounded-2xl p-6 flex flex-col items-center gap-2 transition-colors"
        >
          {file ? (
            <>
              <FileUp className="w-8 h-8 text-primary" />
              <p className="text-sm font-medium text-foreground line-clamp-1 px-3 text-center">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              <p className="text-xs text-primary mt-1">{t("uploadDialog.changeFile")}</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {t("uploadDialog.choosePdf")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("uploadDialog.hint", {
                  max: Math.floor(CV_MAX_BYTES / 1024 / 1024),
                })}
              </p>
            </>
          )}
        </button>

        {localError ? (
          <p className="text-xs text-destructive">{localError}</p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="cv-name" className="text-sm">
            {t("uploadDialog.nameLabel")}
          </Label>
          <Input
            id="cv-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            maxLength={CV_FILE_NAME_MAX}
            placeholder={t("uploadDialog.namePlaceholder")}
            className="h-10 rounded-xl"
          />
        </div>

        {!forceDefault ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={makeDefault}
              onCheckedChange={(v) => setMakeDefault(v === true)}
            />
            <span className="text-sm text-foreground">
              {t("uploadDialog.makeDefault")}
            </span>
          </label>
        ) : null}
      </div>

      <DialogFooter className="gap-1">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-9 px-3 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-60"
        >
          {t("uploadDialog.cancel")}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!file || busy}
          className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {t("uploadDialog.upload")}
        </button>
      </DialogFooter>
    </>
  )
}

export function CvUploadDialog({
  open,
  onOpenChange,
  forceDefault,
  onUploaded,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        {open ? (
          <UploadForm
            forceDefault={forceDefault}
            onUploaded={onUploaded}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
