"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { FileText, Plus, FileEdit } from "lucide-react"

import type { MemberCv } from "../types"
import { CvCard } from "./cv-card"
import { CvBuilderDialog } from "./cv-builder-dialog"
import { CvUploadDialog } from "./cv-upload-dialog"

export function CvsSection({ cvs }: { cvs: MemberCv[] }) {
  const t = useTranslations("cvs")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)

  return (
    <>
      <CvUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <CvBuilderDialog open={builderOpen} onOpenChange={setBuilderOpen} />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            {t("section.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("section.description")}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setBuilderOpen(true)}
            className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <FileEdit className="w-3.5 h-3.5" /> {t("section.buildButton")}
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t("section.uploadButton")}
          </button>
        </div>
      </div>

      {cvs.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="w-9 h-9 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("section.empty")}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <button
              type="button"
              onClick={() => setBuilderOpen(true)}
              className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <FileEdit className="w-3.5 h-3.5" /> {t("section.buildButton")}
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="h-8 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> {t("section.uploadButton")}
            </button>
          </div>
        </div>
      ) : (
        <div className="-mx-3 divide-y divide-border/20">
          {cvs.map((cv) => (
            <CvCard key={cv.id} cv={cv} />
          ))}
        </div>
      )}
    </>
  )
}
