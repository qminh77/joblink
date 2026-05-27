"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { ChevronRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"

import {
  useCompanyApplicants,
  useUpdateApplicationStatus,
} from "../../hooks"
import type {
  DashboardApplicantsPage,
  DashboardAppStatus,
} from "../../types"

import { fadeUp, staggerSm } from "@/lib/animations"
import { PIPELINE_STAGES } from "./shared"

type Props = {
  initialData: DashboardApplicantsPage
}

export function PipelineTab({ initialData }: Props) {
  const t = useTranslations("companies.dashboard")
  const update = useUpdateApplicationStatus()

  const { data } = useCompanyApplicants({
    status: "all",
    limit: 200,
    initialData,
  })
  const items = data?.items ?? []

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const buckets = useMemo(() => {
    const map = new Map<DashboardAppStatus, typeof items>()
    for (const stage of PIPELINE_STAGES) map.set(stage, [])
    for (const item of items) {
      const bucket = map.get(item.status)
      if (bucket) bucket.push(item)
    }
    return map
  }, [items])

  function advanceTo(
    appId: number,
    currentStage: DashboardAppStatus,
  ): DashboardAppStatus | null {
    const idx = PIPELINE_STAGES.indexOf(currentStage)
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return null
    return PIPELINE_STAGES[idx + 1]
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {PIPELINE_STAGES.map((stage) => {
        const list = buckets.get(stage) ?? []
        const isCollapsed = collapsed[stage] ?? false
        return (
          <Card
            key={stage}
            className="border-border/40 rounded-2xl"
          >
            <CardHeader className="pb-0">
              <button
                type="button"
                className="flex items-center justify-between w-full"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [stage]: !prev[stage] }))
                }
              >
                <CardTitle className="font-headline font-semibold text-sm">
                  {t(`appStatus.${stage}`)}
                </CardTitle>
                <Badge variant="secondary" className="rounded-full text-[10px] min-w-5 h-5 justify-center">
                  {list.length}
                </Badge>
              </button>
            </CardHeader>

            <CardContent>
              {!isCollapsed ? (
                <motion.div
                  variants={staggerSm}
                  initial="hidden"
                  animate="show"
                  className="space-y-2 min-h-[100px] pt-1"
                >
                  {list.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic text-center py-4">
                      {t("pipelineEmpty")}
                    </p>
                  ) : (
                    list.map((app) => {
                      const next = advanceTo(app.applicationId, stage)
                      return (
                        <motion.div
                          key={app.applicationId}
                          variants={fadeUp}
                          className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="w-6 h-6 shrink-0">
                              {app.avatarUrl ? (
                                <AvatarImage
                                  src={app.avatarUrl}
                                  alt={app.displayName}
                                />
                              ) : null}
                              <AvatarFallback className="text-[9px]">
                                {getInitials(app.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            <Link
                              href={`/profile/${app.applicantId}`}
                              className="font-semibold text-foreground truncate hover:text-primary transition-colors"
                            >
                              {app.displayName}
                            </Link>
                          </div>
                          <p className="text-muted-foreground truncate mt-1 leading-tight">
                            {app.jobTitle}
                          </p>
                          {next ? (
                            <button
                              type="button"
                              disabled={update.isPending}
                              onClick={() =>
                                update.mutate({
                                  applicationId: app.applicationId,
                                  newStatus: next,
                                })
                              }
                              className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50 transition-colors"
                            >
                              {t("moveTo", { stage: t(`appStatus.${next}`) })}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ) : null}
                        </motion.div>
                      )
                    })
                  )}
                </motion.div>
              ) : null}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
