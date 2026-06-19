"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { createClient } from "@/lib/supabase/client"

import { getProfileForCvBuilderAction, registerCvAction } from "../api/actions"
import { CV_BUCKET, CV_FILE_NAME_MAX } from "../lib/constants"
import { CvBuilderPreview } from "./cv-builder-preview"

type ProfileData = {
  fullName: string
  email: string
  phone: string | null
  headline: string | null
  experiences: {
    id: number
    companyName: string
    position: string
    startDate: string
    endDate: string | null
    isCurrent: boolean
    description: string | null
  }[]
  educations: {
    id: number
    schoolName: string
    degree: string | null
    fieldOfStudy: string | null
    startDate: string | null
    endDate: string | null
    description: string | null
  }[]
  skills: { id: number; name: string }[]
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function BuilderForm({
  data,
  onClose,
}: {
  data: ProfileData
  onClose: () => void
}) {
  const t = useTranslations("cvs")
  const router = useRouter()
  const current = useCurrentUser()
  const previewRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState(false)

  const [selectedExps, setSelectedExps] = useState<Set<number>>(
    new Set(data.experiences.map((e) => e.id)),
  )
  const [selectedEdus, setSelectedEdus] = useState<Set<number>>(
    new Set(data.educations.map((e) => e.id)),
  )
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(data.skills.map((s) => s.name)),
  )
  const [fileName, setFileName] = useState(
    `${data.fullName.replace(/\s+/g, "_")}_CV`,
  )

  const toggleExp = (id: number) =>
    setSelectedExps((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleEdu = (id: number) =>
    setSelectedEdus((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleSkill = (name: string) =>
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const filteredExps = data.experiences.filter((e) => selectedExps.has(e.id))
  const filteredEdus = data.educations.filter((e) => selectedEdus.has(e.id))
  const filteredSkills = data.skills.filter((s) => selectedSkills.has(s.name))

  const generate = useCallback(async () => {
    if (!previewRef.current || !current) return
    setPending(true)
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      const blob = pdf.output("blob")

      const file = new File([blob], `${fileName}.pdf`, {
        type: "application/pdf",
      })

      const supabase = createClient()
      const path = `${current.id}/${crypto.randomUUID()}.pdf`
      const { error: uploadErr } = await supabase.storage
        .from(CV_BUCKET)
        .upload(path, file, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        })
      if (uploadErr) throw new Error(uploadErr.message)

      const res = await registerCvAction({
        fileName: fileName.trim() || "CV",
        storagePath: path,
        fileSize: file.size,
        mimeType: "application/pdf",
        source: "builder",
        builderConfig: {
          experiences: Array.from(selectedExps),
          educations: Array.from(selectedEdus),
          skills: Array.from(selectedSkills),
        },
      })
      if (!res.ok) throw new Error(res.error ?? t("messages.unknownError"))

      toast.success(t("messages.uploadSuccess"))
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("messages.unknownError"))
    } finally {
      setPending(false)
    }
  }, [
    current,
    fileName,
    selectedExps,
    selectedEdus,
    selectedSkills,
    onClose,
    t,
    router,
  ])

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-headline">
          {t("builderDialog.title")}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="cv-builder-name" className="text-sm">
            {t("uploadDialog.nameLabel")}
          </Label>
          <Input
            id="cv-builder-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            maxLength={CV_FILE_NAME_MAX}
            placeholder={t("uploadDialog.namePlaceholder")}
            className="h-10 rounded-xl"
          />
        </div>

        <ScrollArea className="max-h-[60vh] -mx-1 px-1">
          <div className="space-y-4">
            {/* Experiences */}
            {data.experiences.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("builderDialog.experiences")}
                </h3>
                <div className="space-y-1">
                  {data.experiences.map((exp) => (
                    <label
                      key={exp.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedExps.has(exp.id)}
                        onCheckedChange={() => toggleExp(exp.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {exp.position}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {exp.companyName}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Educations */}
            {data.educations.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("builderDialog.educations")}
                </h3>
                <div className="space-y-1">
                  {data.educations.map((edu) => (
                    <label
                      key={edu.id}
                      className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedEdus.has(edu.id)}
                        onCheckedChange={() => toggleEdu(edu.id)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {edu.schoolName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[edu.degree, edu.fieldOfStudy]
                            .filter(Boolean)
                            .join(" in ") || "\u00a0"}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Skills */}
            {data.skills.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5">
                  {t("builderDialog.skills")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedSkills.has(skill.name)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      {/* Hidden CV preview for PDF capture */}
      <div className="fixed -left-[9999px] top-0" ref={previewRef}>
        <CvBuilderPreview
          fullName={data.fullName}
          email={data.email}
          phone={data.phone}
          headline={data.headline}
          experiences={filteredExps as any}
          educations={filteredEdus as any}
          skills={filteredSkills as any}
        />
      </div>

      <DialogFooter className="gap-1">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="h-9 px-3 inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors disabled:opacity-60"
        >
          {t("builderDialog.cancel")}
        </button>
        <button
          type="button"
          onClick={generate}
          disabled={
            pending ||
            (filteredExps.length === 0 &&
              filteredEdus.length === 0 &&
              filteredSkills.length === 0)
          }
          className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : null}
          {t("builderDialog.create")}
        </button>
      </DialogFooter>
    </>
  )
}

export function CvBuilderDialog({ open, onOpenChange }: Props) {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const t = useTranslations("cvs")

  useEffect(() => {
    if (!open) {
      setData(null)
      return
    }
    setLoading(true)
    getProfileForCvBuilderAction()
      .then((res) => {
        if (res.ok) setData(res.data)
      })
      .finally(() => setLoading(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl sm:max-w-lg"
        showCloseButton={false}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <BuilderForm data={data} onClose={() => onOpenChange(false)} />
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t("builderDialog.loadError")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
