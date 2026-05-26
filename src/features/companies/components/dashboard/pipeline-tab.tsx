"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"

import {
  useCompanyApplicants,
  useUpdateApplicationStatus,
} from "../../hooks"
import type {
  DashboardApplicantsPage,
  DashboardAppStatus,
} from "../../types"

import { PIPELINE_STAGES } from "./shared"

type Props = {
  initialData: DashboardApplicantsPage
}

/**
 * Kanban-style pipeline. Đơn giản: nút "→" để chuyển sang stage kế tiếp; nút
 * "Reject" để đẩy ra ngoài pipeline. Kéo-thả để sau, scope MVP recruiter.
 */
export function PipelineTab({ initialData }: Props) {
  const t = useTranslations("companies.dashboard")
  const update = useUpdateApplicationStatus()

  // Load full set (limit 200) — đủ cho recruiter SMB. Pipeline cần thấy tất cả
  // pending applicants, không paginate.
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
    const next = PIPELINE_STAGES[idx + 1]
    void appId
    return next
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {PIPELINE_STAGES.map((stage) => {
        const list = buckets.get(stage) ?? []
        const isCollapsed = collapsed[stage] ?? false
        return (
          <Card
            key={stage}
            className="bg-card border-border/30 rounded-xl p-4"
          >
            <button
              type="button"
              className="flex items-center justify-between w-full mb-3"
              onClick={() =>
                setCollapsed((prev) => ({ ...prev, [stage]: !prev[stage] }))
              }
            >
              <h3 className="font-semibold text-sm text-foreground">
                {t(`appStatus.${stage}`)}
              </h3>
              <span className="text-xs text-muted-foreground">
                {list.length}
              </span>
            </button>

            {!isCollapsed ? (
              <div className="space-y-2 min-h-[120px]">
                {list.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic text-center py-4">
                    {t("pipelineEmpty")}
                  </p>
                ) : (
                  list.map((app) => {
                    const next = advanceTo(app.applicationId, stage)
                    return (
                      <div
                        key={app.applicationId}
                        className="p-2.5 rounded-lg bg-muted/50 border border-border/30 text-xs"
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
                            className="font-semibold text-foreground truncate hover:text-primary"
                          >
                            {app.displayName}
                          </Link>
                        </div>
                        <p className="text-muted-foreground truncate mt-1">
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
                            className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline disabled:opacity-50"
                          >
                            {t("moveTo", { stage: t(`appStatus.${next}`) })}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
