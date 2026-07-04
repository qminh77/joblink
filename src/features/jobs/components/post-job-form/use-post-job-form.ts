"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { createJobAction, updateJobAction } from "../../api/actions"
import type { JobEditData } from "../../types"

type SubmitStatus = "draft" | "active"

// ISO (vd 2026-06-01T23:59:59Z) -> YYYY-MM-DD cho <input type="date">.
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function usePostJobForm({ editJob }: { editJob?: JobEditData }) {
  const t = useTranslations("jobs.post")
  const router = useRouter()

  const isEdit = Boolean(editJob)
  const init = editJob?.job

  const [title, setTitle] = useState(init?.title ?? "")
  const [description, setDescription] = useState(init?.description ?? "")
  const [requirements, setRequirements] = useState(init?.requirements ?? "")
  const [provinceId, setProvinceId] = useState<number | null>(
    init?.provinceId ?? null,
  )
  const [wardId, setWardId] = useState<number | null>(init?.wardId ?? null)
  const [jobTypeId, setJobTypeId] = useState<string>(
    init?.jobTypeId != null ? String(init.jobTypeId) : "",
  )
  const [workModeId, setWorkModeId] = useState<string>(
    init?.workModeId != null ? String(init.workModeId) : "",
  )
  const [positionTitle, setPositionTitle] = useState(init?.positionTitle ?? "")
  const [expiresAt, setExpiresAt] = useState(isoToDateInput(init?.expiresAt))
  const [salaryMin, setSalaryMin] = useState(
    init?.salaryMin != null ? String(init.salaryMin) : "",
  )
  const [salaryMax, setSalaryMax] = useState(
    init?.salaryMax != null ? String(init.salaryMax) : "",
  )
  const [skills, setSkills] = useState<string[]>(editJob?.skills ?? [])
  const [skillInput, setSkillInput] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const cancelHref = isEdit ? "/company/jobs" : "/company/dashboard"
  const minExpiresAt = new Date().toISOString().slice(0, 10)

  function addSkill() {
    const value = skillInput.trim()
    if (!value || skills.includes(value) || skills.length >= 20) return
    setSkills((prev) => [...prev, value])
    setSkillInput("")
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((item) => item !== skill))
  }

  async function submit(status: SubmitStatus) {
    if (submitting) return
    if (!jobTypeId) {
      toast.error(t("jobTypeRequired"))
      return
    }
    if (!workModeId) {
      toast.error(t("workModeRequired"))
      return
    }

    const expiresAtIso = expiresAt
      ? new Date(`${expiresAt}T23:59:59`).toISOString()
      : null
    const content = {
      title,
      description,
      requirements: requirements || null,
      provinceId,
      wardId,
      jobTypeId: Number(jobTypeId),
      workModeId: Number(workModeId),
      positionTitle: positionTitle.trim() || null,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      salaryVisible: true,
      expiresAt: expiresAtIso,
      skills: skills.length > 0 ? skills : undefined,
    }

    setSubmitting(true)
    const result =
      isEdit && editJob
        ? await updateJobAction({ ...content, jobId: editJob.job.id })
        : await createJobAction({ ...content, status })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    if (isEdit && editJob) {
      toast.success(t("updateSuccess"))
      router.push("/company/jobs")
      return
    }

    toast.success(
      status === "active" ? t("publishSuccess") : t("draftSuccess"),
    )
    router.push(
      status === "active" ? `/jobs/${result.jobId}` : "/company/jobs",
    )
  }

  return {
    addSkill,
    cancelHref,
    description,
    expiresAt,
    isEdit,
    jobTypeId,
    minExpiresAt,
    positionTitle,
    provinceId,
    removeSkill,
    requirements,
    salaryMax,
    salaryMin,
    setDescription,
    setExpiresAt,
    setJobTypeId,
    setPositionTitle,
    setProvinceId,
    setRequirements,
    setSalaryMax,
    setSalaryMin,
    setSkillInput,
    setTitle,
    setWardId,
    setWorkModeId,
    skillInput,
    skills,
    submit,
    submitting,
    t,
    title,
    wardId,
    workModeId,
  }
}
