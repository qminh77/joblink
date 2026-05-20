"use client"

import { Briefcase, GraduationCap, User, Wrench } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MemberProfileDetail } from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"

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
  return (
    <Tabs defaultValue="info">
      <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto flex-nowrap">
        <TabsTrigger
          value="info"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <User className="w-4 h-4 mr-1.5" /> Cơ bản
        </TabsTrigger>
        <TabsTrigger
          value="experience"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <Briefcase className="w-4 h-4 mr-1.5" /> Kinh nghiệm
        </TabsTrigger>
        <TabsTrigger
          value="education"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <GraduationCap className="w-4 h-4 mr-1.5" /> Học vấn
        </TabsTrigger>
        <TabsTrigger
          value="skills"
          className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
        >
          <Wrench className="w-4 h-4 mr-1.5" /> Kỹ năng
        </TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="mt-5 focus-visible:outline-none">
        <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
          <h2 className="font-headline font-bold text-base text-foreground mb-5">
            Thông tin cơ bản
          </h2>
          <BasicInfoForm profile={profile} provinces={provinces} />
        </Card>
      </TabsContent>

      <TabsContent
        value="experience"
        className="mt-5 focus-visible:outline-none"
      >
        <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
          <ExperiencesSection experiences={profile.experiences} />
        </Card>
      </TabsContent>

      <TabsContent
        value="education"
        className="mt-5 focus-visible:outline-none"
      >
        <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
          <EducationsSection educations={profile.educations} />
        </Card>
      </TabsContent>

      <TabsContent value="skills" className="mt-5 focus-visible:outline-none">
        <Card className="bg-card border-border/30 rounded-2xl p-5 sm:p-6">
          <SkillsSection skills={profile.skills} />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
