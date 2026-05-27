"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Briefcase, Eye, Plus, TrendingUp, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { btnTap, fadeUp, pageEntrance, staggerSm } from "@/lib/animations"

import type {
  DashboardApplicantsPage,
  DashboardJobsPage,
  DashboardOverview,
} from "../../types"

import { ApplicantsTab } from "./applicants-tab"
import { JobsTab } from "./jobs-tab"
import { OverviewTab } from "./overview-tab"
import { PipelineTab } from "./pipeline-tab"

type Props = {
  companyName: string
  initialOverview: DashboardOverview
  initialJobs: DashboardJobsPage
  initialApplicants: DashboardApplicantsPage
}

const numberFormatter = new Intl.NumberFormat("vi-VN")

export function DashboardClient({
  companyName,
  initialOverview,
  initialJobs,
  initialApplicants,
}: Props) {
  const t = useTranslations("companies.dashboard")
  const [tab, setTab] = useState("overview")

  const stats = initialOverview.stats

  const statCards = [
    {
      label: t("statActiveJobs"),
      value: numberFormatter.format(stats.activeJobs),
      icon: Briefcase,
    },
    {
      label: t("statApplications"),
      value: numberFormatter.format(stats.totalApplications),
      icon: Users,
      caption: t("statApplicationsThisMonth", {
        count: stats.applicationsThisMonth,
      }),
    },
    {
      label: t("statViews"),
      value: numberFormatter.format(stats.jobViews),
      icon: Eye,
    },
    {
      label: t("statHireRate"),
      value: `${stats.hireRate}%`,
      icon: TrendingUp,
    },
  ] as const

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="font-headline font-bold text-xl text-foreground">
            {t("heading")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {companyName} &bull; {t("subheading")}
          </p>
        </div>
        <Link href="/company/post-job">
          <motion.span {...btnTap}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              {t("postJob")}
            </Button>
          </motion.span>
        </Link>
      </div>

      <motion.div
        variants={staggerSm}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-1"
      >
        {statCards.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <Card className="bg-card border-border/40 rounded-2xl p-4 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    {s.label}
                  </p>
                  <h3 className="font-headline font-bold text-xl text-foreground mt-1 tabular-nums">
                    {s.value}
                  </h3>
                  {"caption" in s && s.caption ? (
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {s.caption}
                    </span>
                  ) : null}
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-2xl overflow-x-auto max-w-full">
          <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4">
            {t("tabOverview")}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4">
            {t("tabJobs")}
          </TabsTrigger>
          <TabsTrigger value="applicants" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4">
            {t("tabApplicants")}
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4">
            {t("tabPipeline")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab
            recentJobs={initialOverview.recentJobs}
            recentApplicants={initialOverview.recentApplicants}
          />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <JobsTab initialData={initialJobs} />
        </TabsContent>

        <TabsContent value="applicants" className="mt-4">
          <ApplicantsTab initialData={initialApplicants} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <PipelineTab initialData={initialApplicants} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
