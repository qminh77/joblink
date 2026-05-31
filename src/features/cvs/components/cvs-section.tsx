"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { FileText, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { MemberCv } from "../types"
import { CvCard } from "./cv-card"
import { CvUploadDialog } from "./cv-upload-dialog"

export function CvsSection({ cvs }: { cvs: MemberCv[] }) {
  const t = useTranslations("cvs")
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <CvUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            {t("section.title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("section.description")}
          </p>
        </div>
        <Button size="sm" className="rounded-lg shrink-0" onClick={() => setUploadOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> {t("section.uploadButton")}
        </Button>
      </div>

      {cvs.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border/50 rounded-2xl">
          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("section.empty")}</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg mt-3"
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> {t("section.uploadButton")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cvs.map((cv) => (
            <CvCard key={cv.id} cv={cv} />
          ))}
        </div>
      )}
    </>
  )
}
