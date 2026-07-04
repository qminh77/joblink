"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Briefcase, Loader2, Plus, X } from "lucide-react"

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
import { LocationSelect } from "@/features/locations/components/location-select"
import { fadeUp, pageEntrance, staggerMd, staggerSm } from "@/lib/animations"
import type { ProvinceRow } from "@/types/database"

import type { JobEditData, JobTypeRef, WorkModeRef } from "../types"
import { usePostJobForm } from "./post-job-form/use-post-job-form"

type Props = {
  provinces: ProvinceRow[]
  jobTypes: JobTypeRef[]
  workModes: WorkModeRef[]
  // Khi có editJob → form ở chế độ sửa: prefill + gọi updateJobAction.
  editJob?: JobEditData
}

export function PostJobForm({ provinces, jobTypes, workModes, editJob }: Props) {
  const {
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
  } = usePostJobForm({ editJob })

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
        onSubmit={(event) => {
          event.preventDefault()
          void submit("active")
        }}
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
              <div className="md:col-span-2">
                <LocationSelect
                  provinces={provinces}
                  value={{ provinceId, wardId }}
                  onChange={(next) => {
                    setProvinceId(next.provinceId)
                    setWardId(next.wardId)
                  }}
                />
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
                  min={minExpiresAt}
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
            href={cancelHref}
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 h-8 rounded-lg transition-colors inline-flex items-center"
          >
            {t("cancel")}
          </Link>
          {/* Sửa tin không đổi trạng thái → ẩn "Lưu nháp" (chỉ ở chế độ tạo). */}
          {!isEdit ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit("draft")}
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
