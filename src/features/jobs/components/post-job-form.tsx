"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { btnTap, fadeUp, pageEntrance, staggerMd, staggerSm } from "@/lib/animations"
import type { ProvinceRow } from "@/types/database"

import { createJobAction } from "../api/actions"
import type {
  JobPositionRef,
  JobTypeRef,
  WorkModeRef,
} from "../types"

type Props = {
  provinces: ProvinceRow[]
  jobTypes: JobTypeRef[]
  workModes: WorkModeRef[]
  jobPositions: JobPositionRef[]
}

export function PostJobForm({
  provinces,
  jobTypes,
  workModes,
  jobPositions,
}: Props) {
  const t = useTranslations("jobs.post")
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [requirements, setRequirements] = useState("")
  const [provinceId, setProvinceId] = useState<string>("")
  const [jobTypeId, setJobTypeId] = useState<string>("")
  const [workModeId, setWorkModeId] = useState<string>("")
  const [jobPositionId, setJobPositionId] = useState<string>("")
  const [salaryMin, setSalaryMin] = useState("")
  const [salaryMax, setSalaryMax] = useState("")
  const [skills, setSkills] = useState<string[]>([])
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

    setSubmitting(true)
    const result = await createJobAction({
      title,
      description,
      requirements: requirements || null,
      provinceId: provinceId ? Number(provinceId) : null,
      jobTypeId: Number(jobTypeId),
      workModeId: Number(workModeId),
      jobPositionId: jobPositionId ? Number(jobPositionId) : null,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      salaryVisible: true,
      status,
      skills: skills.length > 0 ? skills : undefined,
    })
    setSubmitting(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success(
      status === "active" ? t("publishSuccess") : t("draftSuccess"),
    )
    router.push(
      status === "active"
        ? `/jobs/${result.jobId}`
        : "/company/dashboard",
    )
  }

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="font-headline font-bold text-2xl text-foreground">
          {t("heading")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subheading")}</p>
      </div>

      <motion.form
        variants={staggerMd}
        initial="hidden"
        animate="show"
        onSubmit={(e) => handleSubmit(e, "active")}
        className="space-y-6"
      >
        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/30 rounded-xl p-6">
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
                <Label className="font-medium">
                  {t("jobPositionLabel")}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({t("optional")})
                  </span>
                </Label>
                <Select
                  value={jobPositionId}
                  onValueChange={setJobPositionId}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder={t("jobPositionPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPositions.map((jp) => (
                      <SelectItem key={jp.id} value={String(jp.id)}>
                        {jp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          <Card className="bg-card border-border/30 rounded-xl p-6">
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
          <Card className="bg-card border-border/30 rounded-xl p-6">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
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
              <motion.span {...btnTap}>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl h-10"
                  onClick={addSkill}
                  disabled={!skillInput.trim() || skills.length >= 20}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </motion.span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {t("skillsHint", { count: skills.length, max: 20 })}
            </p>
          </Card>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex items-center justify-end gap-3"
        >
          <Link href="/company/dashboard">
            <Button type="button" variant="outline" className="rounded-xl">
              {t("cancel")}
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={submitting}
            onClick={(e) =>
              handleSubmit(
                e as unknown as React.FormEvent<HTMLFormElement>,
                "draft",
              )
            }
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : null}
            {t("saveDraft")}
          </Button>
          <Button
            type="submit"
            className="rounded-xl px-6"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Briefcase className="w-4 h-4 mr-1.5" />
            )}
            {t("publish")}
          </Button>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
