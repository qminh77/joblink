"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  Briefcase,
  FileText,
  GraduationCap,
  Sparkles,
  User,
  Wrench,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CvsSection } from "@/features/cvs/components/cvs-section"
import type { MemberCv } from "@/features/cvs/types"
import type { MemberProfileDetail } from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"
import { fadeUp } from "@/lib/animations"

import { AvatarCoverEditor } from "./avatar-cover-editor"
import { BasicInfoForm } from "./basic-info-form"
import { EducationsSection } from "./educations-section"
import { ExperiencesSection } from "./experiences-section"
import { SkillsSection } from "./skills-section"

// Tính độ hoàn thiện hồ sơ (0..100) dựa trên các trường khoá. UX dùng số này
// để khuyến khích member bổ sung — không lưu DB.
function completeness(profile: MemberProfileDetail, cvs: MemberCv[]): number {
  const checks: boolean[] = [
    Boolean(profile.avatar_url),
    Boolean(profile.headline?.trim()),
    Boolean(profile.about?.trim()),
    Boolean(profile.province_id),
    profile.experiences.length > 0,
    profile.educations.length > 0,
    profile.skills.length >= 3,
    cvs.length > 0,
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

const TAB_VALUE = {
  info: "info",
  experience: "experience",
  education: "education",
  skills: "skills",
  cv: "cv",
} as const

export function EditProfileTabs({
  profile,
  provinces,
  cvs,
}: {
  profile: MemberProfileDetail
  provinces: ProvinceRow[]
  cvs: MemberCv[]
}) {
  const t = useTranslations("profile")
  const percent = useMemo(() => completeness(profile, cvs), [profile, cvs])

  return (
    <div className="space-y-5">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <AvatarCoverEditor
          userId={profile.user_id}
          fullName={profile.full_name}
          avatarUrl={profile.avatar_url}
          coverUrl={profile.cover_url}
        />
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="rounded-2xl bg-muted/40 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-sm sm:text-base text-foreground">
                  {t("edit.completeness.title")}
                </h2>
                <span className="text-sm font-bold text-primary">{percent}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-background/70 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {percent === 100
                  ? t("edit.completeness.done")
                  : t("edit.completeness.hint")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue={TAB_VALUE.info}>
        <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto flex-nowrap w-full justify-start">
          <TabsTrigger
            value={TAB_VALUE.info}
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            <User className="w-4 h-4 mr-1.5" /> {t("edit.tabs.basic")}
          </TabsTrigger>
          <TabsTrigger
            value={TAB_VALUE.experience}
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            <Briefcase className="w-4 h-4 mr-1.5" /> {t("edit.tabs.experiences")}
          </TabsTrigger>
          <TabsTrigger
            value={TAB_VALUE.education}
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            <GraduationCap className="w-4 h-4 mr-1.5" />{" "}
            {t("edit.tabs.educations")}
          </TabsTrigger>
          <TabsTrigger
            value={TAB_VALUE.skills}
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            <Wrench className="w-4 h-4 mr-1.5" /> {t("edit.tabs.skills")}
          </TabsTrigger>
          <TabsTrigger
            value={TAB_VALUE.cv}
            className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
          >
            <FileText className="w-4 h-4 mr-1.5" /> {t("edit.tabs.cvs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value={TAB_VALUE.info}
          className="mt-5 focus-visible:outline-none"
        >
          <motion.div key="info" variants={fadeUp} initial="hidden" animate="show">
            <div className="rounded-2xl bg-muted/30 p-5 sm:p-6">
              <h2 className="font-headline font-bold text-base text-foreground mb-5">
                {t("basic.title")}
              </h2>
              <BasicInfoForm profile={profile} provinces={provinces} />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent
          value={TAB_VALUE.experience}
          className="mt-5 focus-visible:outline-none"
        >
          <motion.div
            key="experience"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="rounded-2xl bg-muted/30 p-5 sm:p-6">
              <ExperiencesSection experiences={profile.experiences} />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent
          value={TAB_VALUE.education}
          className="mt-5 focus-visible:outline-none"
        >
          <motion.div
            key="education"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="rounded-2xl bg-muted/30 p-5 sm:p-6">
              <EducationsSection educations={profile.educations} />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent
          value={TAB_VALUE.skills}
          className="mt-5 focus-visible:outline-none"
        >
          <motion.div
            key="skills"
            variants={fadeUp}
            initial="hidden"
            animate="show"
          >
            <div className="rounded-2xl bg-muted/30 p-5 sm:p-6">
              <SkillsSection skills={profile.skills} />
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent
          value={TAB_VALUE.cv}
          className="mt-5 focus-visible:outline-none"
        >
          <motion.div key="cv" variants={fadeUp} initial="hidden" animate="show">
            <div className="rounded-2xl bg-muted/30 p-5 sm:p-6">
              <CvsSection cvs={cvs} />
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
