"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { FileText, Plus, Star } from "lucide-react"

import { Label } from "@/components/ui/label"

import { CvUploadDialog } from "./cv-upload-dialog"
import type { MemberCv } from "../types"

type Props = {
  cvs: MemberCv[]
  value: number | null
  onChange: (cvId: number | null) => void
  // Parent gọi để re-fetch CVs sau upload — picker không lưu state của list.
  refreshOnUpload?: () => Promise<MemberCv[]> | MemberCv[]
}

export function CvPicker({ cvs, value, onChange, refreshOnUpload }: Props) {
  const t = useTranslations("cvs")
  const [uploadOpen, setUploadOpen] = useState(false)

  // Auto-select default CV khi parent đổi danh sách mà chưa có value.
  // (Setting state qua callback `onChange` thuộc về parent — không vi phạm
  // rule "no setState in effect" cho component này.)
  useEffect(() => {
    if (value || cvs.length === 0) return
    const def = cvs.find((c) => c.isDefault) ?? cvs[0]
    if (def) onChange(def.id)
  }, [value, cvs, onChange])

  async function handleUploaded(newCvId: number) {
    if (refreshOnUpload) {
      await refreshOnUpload()
    }
    onChange(newCvId)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t("picker.label")}</Label>
        <button
          type="button"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          onClick={() => setUploadOpen(true)}
        >
          <Plus className="w-3 h-3" /> {t("picker.uploadNew")}
        </button>
      </div>

      <CvUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploaded}
      />

      {cvs.length === 0 ? (
        <div className="bg-muted/40 rounded-xl py-6 text-center">
          <FileText className="w-7 h-7 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("picker.empty")}</p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="h-8 px-3 mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t("picker.uploadFirst")}
          </button>
        </div>
      ) : (
        <div className="grid gap-1">
          {cvs.map((cv) => {
            const selected = cv.id === value
            return (
              <button
                key={cv.id}
                type="button"
                onClick={() => onChange(cv.id)}
                className={
                  "flex items-center gap-3 text-left rounded-xl px-3 py-2.5 transition-colors " +
                  (selected ? "bg-primary/5" : "hover:bg-muted/60")
                }
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground line-clamp-1">
                      {cv.fileName}
                    </span>
                    {cv.isDefault ? (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(cv.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div
                  className={
                    "w-4 h-4 rounded-full shrink-0 transition-colors " +
                    (selected
                      ? "bg-primary ring-4 ring-primary/20"
                      : "bg-muted")
                  }
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
