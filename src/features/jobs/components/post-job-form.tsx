"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fadeUp, pageEntrance, staggerMd, staggerSm } from "@/lib/animations"
import type { ProvinceRow } from "@/types/database"

import { createJobAction, updateJobAction } from "../api/actions"
import type { JobEditData, JobTypeRef, WorkModeRef } from "../types"

type Props = {
  provinces: ProvinceRow[]
  jobTypes: JobTypeRef[]
  workModes: WorkModeRef[]
  // Khi có editJob → form ở chế độ sửa: prefill + gọi updateJobAction.
  editJob?: JobEditData
}

// ISO (vd 2026-06-01T23:59:59Z) → YYYY-MM-DD cho <input type="date">.
function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function PostJobForm({ provinces, jobTypes, workModes, editJob }: Props) {
  const t = useTranslations("jobs.post")
  const router = useRouter()

  const isEdit = Boolean(editJob)
  const init = editJob?.job

  const [title, setTitle] = useState(init?.title ?? "")
  const [description, setDescription] = useState(init?.description ?? "")
  const [requirements, setRequirements] = useState(init?.requirements ?? "")
  const [provinceId, setProvinceId] = useState<string>(
    init?.provinceId != null ? String(init.provinceId) : "",
  )
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

  function addSkill() {
    const v = skillInput.trim()
    if (!v || skills.includes(v) || skills.length >= 20) return
    setSkills((prev) => [...prev, v])
    setSkillInput("")
  }

  function removeSkill(s: string) {
    setSkills((prev) => prev.filter((x) => x !== s))
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
    status: "draft" | "active",
  ) {
    e.preventDefault()
    if (submitting) return
    if (!jobTypeId) {
      toast.error(t("jobTypeRequired"))
      return
    }
    if (!workModeId) {
      toast.error(t("workModeRequired"))
      return
    }

    // Hạn nộp đơn dạng YYYY-MM-DD từ <input type="date"> → ISO cuối ngày
    // (23:59 local) để cùng ngày người dùng vẫn ứng tuyển được.
    const expiresAtIso = expiresAt
      ? new Date(`${expiresAt}T23:59:59`).toISOString()
      : null

    // Nội dung chung cho cả tạo & sửa (sửa không gửi `status`).
    const content = {
      title,
      description,
      requirements: requirements || null,
      provinceId: provinceId ? Number(provinceId) : null,
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
      router.push(`/jobs/${editJob.job.id}`)
      return
    }

    toast.success(
      status === "active" ? t("publishSuccess") : t("draftSuccess"),
    )
    router.push(
      status === "active" ? `/jobs/${result.jobId}` : "/company/dashboard",
    )
  }

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="pb-2 border-b border-border/40">
        <h1 className="font-headline font-bold text-xl text-foreground">
          {isEdit ? t("editHeading") : t("heading")}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isEdit ? t("editSubheading") : t("subheading")}
        </p>
      </div>

      <motion.form
        variants={staggerMd}
        initial="hidden"
        animate="show"
        onSubmit={(e) => handleSubmit(e, "active")}
        className="space-y-6"
      >
        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/40 rounded-2xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-6">
              {t("basicInfo")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="font-medium">
                  {t("titleLabel")}
                </Label>
                <Input
                  id="title"
                  placeholder={t("titlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={255}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("provinceLabel")}</Label>
                <Select value={provinceId} onValueChange={setProvinceId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t("provincePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("jobTypeLabel")}</Label>
                <Select value={jobTypeId} onValueChange={setJobTypeId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t("jobTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTypes.map((jt) => (
                      <SelectItem key={jt.id} value={String(jt.id)}>
                        {jt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("workModeLabel")}</Label>
                <Select value={workModeId} onValueChange={setWorkModeId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t("workModePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {workModes.map((wm) => (
                      <SelectItem key={wm.id} value={String(wm.id)}>
                        {wm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position-title" className="font-medium">
                  {t("positionTitleLabel")}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="position-title"
                  placeholder={t("positionTitlePlaceholder")}
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  maxLength={255}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires-at" className="font-medium">
                  {t("expiresAtLabel")}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({t("optional")})
                  </span>
                </Label>
                <Input
                  id="expires-at"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("expiresAtHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-min" className="font-medium">
                  {t("salaryMinLabel")}
                </Label>
                <Input
                  id="salary-min"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-max" className="font-medium">
                  {t("salaryMaxLabel")}
                </Label>
                <Input
                  id="salary-max"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/40 rounded-2xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-6">
              {t("contentSection")}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="font-medium">
                  {t("descriptionLabel")}
                </Label>
                <Textarea
                  id="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  maxLength={20000}
                  placeholder={t("descriptionPlaceholder")}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements" className="font-medium">
                  {t("requirementsLabel")}
                </Label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  maxLength={10000}
                  placeholder={t("requirementsPlaceholder")}
                  className="rounded-xl resize-none"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/40 rounded-2xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-4">
              {t("skillsSection")}
            </h2>
            <motion.div
              variants={staggerSm}
              initial="hidden"
              animate="show"
              className="flex flex-wrap gap-2 mb-4"
            >
              {skills.map((s) => (
                <motion.span
                  key={s}
                  variants={fadeUp}
                  className="inline-flex items-center gap-1.5 px-3 h-7 bg-muted text-muted-foreground rounded-full text-xs font-medium"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.span>
              ))}
            </motion.div>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                placeholder={t("skillsPlaceholder")}
                className="h-10 rounded-xl flex-1"
                maxLength={100}
                disabled={skills.length >= 20}
              />
              <button
                type="button"
                onClick={addSkill}
                disabled={!skillInput.trim() || skills.length >= 20}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                aria-label={t("skillsPlaceholder")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {t("skillsHint", { count: skills.length, max: 20 })}
            </p>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex items-center justify-end gap-1 pt-2"
        >
          <Link
            href={isEdit && editJob ? `/jobs/${editJob.job.id}` : "/company/dashboard"}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors inline-flex items-center"
          >
            {t("cancel")}
          </Link>
          {/* Sửa tin không đổi trạng thái → ẩn "Lưu nháp" (chỉ ở chế độ tạo). */}
          {!isEdit ? (
            <button
              type="button"
              disabled={submitting}
              onClick={(e) =>
                handleSubmit(
                  e as unknown as React.FormEvent<HTMLFormElement>,
                  "draft",
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {t("saveDraft")}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
            {isEdit ? t("saveChanges") : t("publish")}
          </button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
