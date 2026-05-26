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
      value: "—",
      icon: Eye,
      caption: t("statViewsComingSoon"),
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-foreground">
            {t("heading")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {companyName} • {t("subheading")}
          </p>
        </div>
        <Link href="/company/post-job">
          <motion.span {...btnTap}>
            <Button className="rounded-lg">
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
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((s) => (
          <motion.div key={s.label} variants={fadeUp}>
            <Card className="bg-card border-border/30 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">
                    {s.label}
                  </p>
                  <h3 className="font-headline font-bold text-2xl text-foreground mt-1">
                    {s.value}
                  </h3>
                  {"caption" in s && s.caption ? (
                    <span className="text-[11px] text-muted-foreground">
                      {s.caption}
                    </span>
                  ) : null}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-sm px-4">
            {t("tabOverview")}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg text-sm px-4">
            {t("tabJobs")}
          </TabsTrigger>
          <TabsTrigger value="applicants" className="rounded-lg text-sm px-4">
            {t("tabApplicants")}
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg text-sm px-4">
            {t("tabPipeline")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <OverviewTab
            recentJobs={initialOverview.recentJobs}
            recentApplicants={initialOverview.recentApplicants}
          />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4 space-y-4">
          <JobsTab initialData={initialJobs} />
        </TabsContent>

        <TabsContent value="applicants" className="mt-4 space-y-4">
          <ApplicantsTab initialData={initialApplicants} />
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <PipelineTab initialData={initialApplicants} />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
