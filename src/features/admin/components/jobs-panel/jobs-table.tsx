"use client"

import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import { Briefcase, ExternalLink, RotateCcw, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AdminJobRow } from "@/features/admin/api/jobs"
import type { JobActionTarget } from "./types"
import { STATUS_STYLE } from "./styles"

export function JobsTable({
  items,
  pending,
  onAction,
}: {
  items: AdminJobRow[]
  pending: boolean
  onAction: (target: JobActionTarget) => void
}) {
  const t = useTranslations("admin.jobs")
  const tStatuses = useTranslations("admin.jobs.statuses")
  const format = useFormatter()

  return (
    <Card className="bg-transparent border-none shadow-none rounded-xl overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-muted/20">
              <th className="text-left px-4 py-3 font-semibold">Title</th>
              <th className="text-left px-4 py-3 font-semibold">
                {t("company")}
              </th>
              <th className="text-left px-4 py-3 font-semibold">
                {t("filterStatus")}
              </th>
              <th className="text-left px-4 py-3 font-semibold">
                {t("applications")}
              </th>
              <th className="text-left px-4 py-3 font-semibold">
                {t("createdAt")}
              </th>
              <th className="text-right px-4 py-3 font-semibold">
                {t("open")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center text-muted-foreground py-12"
                >
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-60" />
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((job) => (
                <tr key={job.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{job.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {job.companyName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_STYLE[job.status]}`}
                    >
                      {tStatuses(job.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {job.applicationsCount}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format.dateTime(new Date(job.createdAt), {
                      dateStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/jobs/${job.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      {job.status !== "removed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10"
                          disabled={pending}
                          onClick={() => onAction({ job, action: "remove" })}
                          title={t("remove")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-emerald-500 hover:bg-emerald-500/10"
                          disabled={pending}
                          onClick={() => onAction({ job, action: "restore" })}
                          title={t("restore")}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
