"use client"

import Link from "next/link"
import { useFormatter, useTranslations } from "next-intl"
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  FileText,
  Flag,
  HandHeart,
  Heart,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { AdminDashboardData } from "@/features/admin/types"

const STAT_ICONS = {
  totalUsers: Users,
  newUsers7d: TrendingUp,
  totalCompanies: Building2,
  pendingCompanies: UserCheck,
  totalJobs: Briefcase,
  activeJobs: Briefcase,
  totalApplications: HandHeart,
  pendingReports: Flag,
  totalPosts: FileText,
  totalConnections: Heart,
} as const

type StatKey = keyof typeof STAT_ICONS

const STAT_ORDER: StatKey[] = [
  "totalUsers",
  "newUsers7d",
  "totalCompanies",
  "pendingCompanies",
  "totalJobs",
  "activeJobs",
  "totalApplications",
  "pendingReports",
]

export function DashboardPanel({ data }: { data: AdminDashboardData }) {
  const t = useTranslations("admin.dashboard")
  const tRoles = useTranslations("admin.users.roles")
  const tStatuses = useTranslations("admin.users.statuses")
  const tVerif = useTranslations("admin.companies.statuses")
  const format = useFormatter()

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_ORDER.map((key) => {
          const Icon = STAT_ICONS[key]
          const value = data.stats[key] ?? 0
          return (
            <Card
              key={key}
              className="bg-transparent border-none shadow-none rounded-2xl p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t(`stats.${key}`)}
                </span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {format.number(value)}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <BreakdownCard
          title={t("breakdown.byRole")}
          empty={t("breakdown.empty")}
          rows={Object.entries(data.roleDist).map(([k, v]) => ({
            label: tRoles(k as never),
            value: v ?? 0,
          }))}
        />
        <BreakdownCard
          title={t("breakdown.byStatus")}
          empty={t("breakdown.empty")}
          rows={Object.entries(data.statusDist).map(([k, v]) => ({
            label: tStatuses(k as never),
            value: v ?? 0,
          }))}
        />
        <BreakdownCard
          title={t("breakdown.byVerification")}
          empty={t("breakdown.empty")}
          rows={Object.entries(data.verificationDist).map(([k, v]) => ({
            label: tVerif(k as never),
            value: v ?? 0,
          }))}
        />
      </div>

      <Card className="bg-transparent border-none shadow-none rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">
            {t("breakdown.recentActions")}
          </h3>
          <Link
            href="/admin/audit-log"
            className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
          >
            {t("viewAll")} <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {data.recentActions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {t("breakdown.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border/20">
            {data.recentActions.map((action) => (
              <li
                key={action.id}
                className="py-3 flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[11px]">
                      {action.action}
                    </Badge>
                    <span className="text-foreground font-medium truncate">
                      {action.actor?.displayName ?? "system"}
                    </span>
                    {action.entityType ? (
                      <span className="text-muted-foreground text-xs">
                        → {action.entityType}#{action.entityId}
                      </span>
                    ) : null}
                  </div>
                  {action.reason ? (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {action.reason}
                    </p>
                  ) : null}
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {format.dateTime(new Date(action.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

function BreakdownCard({
  title,
  rows,
  empty,
}: {
  title: string
  empty: string
  rows: Array<{ label: string; value: number }>
}) {
  const filtered = rows.filter((r) => r.value > 0)
  const total = filtered.reduce((acc, r) => acc + r.value, 0) || 1
  return (
    <Card className="bg-transparent border-none shadow-none rounded-2xl p-5">
      <h3 className="font-semibold text-sm text-foreground mb-3">{title}</h3>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => (
            <li key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-foreground">{r.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {r.value}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full"
                  style={{ width: `${(r.value / total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
