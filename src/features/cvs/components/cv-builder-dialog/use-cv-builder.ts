"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { toast } from "sonner"

import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { createClient } from "@/lib/supabase/client"

import { registerCvAction } from "../../api/actions"
import { CV_BUCKET } from "../../lib/constants"
import type {
  CvPreviewEducation,
  CvPreviewExperience,
} from "../cv-builder-preview"
import type { ProfileData } from "./types"

export function useCvBuilder({
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
    new Set(data.experiences.map((experience) => experience.id)),
  )
  const [selectedEdus, setSelectedEdus] = useState<Set<number>>(
    new Set(data.educations.map((education) => education.id)),
  )
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    new Set(data.skills.map((skill) => skill.name)),
  )
  const [fileName, setFileName] = useState(
    `${data.fullName.replace(/\s+/g, "_")}_CV`,
  )

  const filteredExps = useMemo(
    () =>
      data.experiences.filter((experience) =>
        selectedExps.has(experience.id),
      ),
    [data.experiences, selectedExps],
  )
  const filteredEdus = useMemo(
    () =>
      data.educations.filter((education) =>
        selectedEdus.has(education.id),
      ),
    [data.educations, selectedEdus],
  )
  const filteredSkills = useMemo(
    () => data.skills.filter((skill) => selectedSkills.has(skill.name)),
    [data.skills, selectedSkills],
  )
  const previewExperiences: CvPreviewExperience[] = useMemo(
    () =>
      filteredExps.map((experience) => ({
        id: experience.id,
        company_name: experience.companyName,
        position: experience.position,
        start_date: experience.startDate,
        end_date: experience.endDate,
        description: experience.description,
      })),
    [filteredExps],
  )
  const previewEducations: CvPreviewEducation[] = useMemo(
    () =>
      filteredEdus.map((education) => ({
        id: education.id,
        school_name: education.schoolName,
        degree: education.degree,
        field_of_study: education.fieldOfStudy,
        start_date: education.startDate,
        end_date: education.endDate,
        description: education.description,
      })),
    [filteredEdus],
  )

  function toggleExp(id: number) {
    setSelectedExps((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleEdu(id: number) {
    setSelectedEdus((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSkill(name: string) {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

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
      const imgData = canvas.toDataURL("image/jpeg", 0.7)
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST")
      const blob = pdf.output("blob")
      const file = new File([blob], `${fileName}.pdf`, {
        type: "application/pdf",
      })

      const supabase = createClient()
      const path = `${current.id}/${crypto.randomUUID()}.pdf`
      const { error: uploadError } = await supabase.storage
        .from(CV_BUCKET)
        .upload(path, file, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        })
      if (uploadError) throw new Error(uploadError.message)

      const result = await registerCvAction({
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
      if (!result.ok) {
        throw new Error(result.error ?? t("messages.unknownError"))
      }

      toast.success(t("messages.uploadSuccess"))
      router.refresh()
      onClose()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("messages.unknownError"),
      )
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

  return {
    fileName,
    filteredEdus,
    filteredExps,
    filteredSkills,
    generate,
    pending,
    previewEducations,
    previewExperiences,
    previewRef,
    selectedEdus,
    selectedExps,
    selectedSkills,
    setFileName,
    toggleEdu,
    toggleExp,
    toggleSkill,
  }
}
