"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Briefcase, GraduationCap, User, Wrench } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MemberProfileDetail } from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"
import { fadeUp } from "@/lib/animations"

import { BasicInfoForm } from "./basic-info-form"
import { EducationsSection } from "./educations-section"
import { ExperiencesSection } from "./experiences-section"
import { SkillsSection } from "./skills-section"

export function EditProfileTabs({
  profile,
  provinces,
}: {
  profile: MemberProfileDetail
  provinces: ProvinceRow[]
}) {
  const t = useTranslations("profile")

  return (
    <Tabs defaultValue="info">
      <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto flex-nowrap">
        <TabsTrigger
          value="info"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <User className="w-4 h-4 mr-1.5" /> {t("edit.tabs.basic")}
        </TabsTrigger>
        <TabsTrigger
          value="experience"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <Briefcase className="w-4 h-4 mr-1.5" /> {t("edit.tabs.experiences")}
        </TabsTrigger>
        <TabsTrigger
          value="education"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <GraduationCap className="w-4 h-4 mr-1.5" /> {t("edit.tabs.educations")}
        </TabsTrigger>
        <TabsTrigger
          value="skills"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <Wrench className="w-4 h-4 mr-1.5" /> {t("edit.tabs.skills")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-5 focus-visible:outline-none">
        <motion.div
          key="info"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
            <h2 className="font-headline font-bold text-base text-foreground mb-5">
              {t("basic.title")}
            </h2>
            <BasicInfoForm profile={profile} provinces={provinces} />
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent
        value="experience"
        className="mt-5 focus-visible:outline-none"
      >
        <motion.div
          key="experience"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
            <ExperiencesSection experiences={profile.experiences} />
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent
        value="education"
        className="mt-5 focus-visible:outline-none"
      >
        <motion.div
          key="education"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
            <EducationsSection educations={profile.educations} />
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="skills" className="mt-5 focus-visible:outline-none">
        <motion.div
          key="skills"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
            <SkillsSection skills={profile.skills} />
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}
