import Link from "next/link"
import { notFound } from "next/navigation"
import { Briefcase, FileText, Plus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { loadCompanyDashboard } from "../api/company-management"
import type { CompanyDashboardOverview } from "../types"

function ensureCompanyCanManage(user: Awaited<ReturnType<typeof requireCurrentUser>>) {
  if (
    user.appUser.role !== "company" ||
    user.appUser.status !== "active" ||
    user.profile.companyVerificationStatus !== "verified"
  ) {
    notFound()
  }
}

export async function CompanyDashboardServerPage() {
  const current = await requireCurrentUser()
  ensureCompanyCanManage(current)
  const overview = await loadCompanyDashboard(current.appUser.id)

  return <CompanyDashboard overview={overview} />
}

function CompanyDashboard({ overview }: { overview: CompanyDashboardOverview }) {
  const { stats } = overview
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Bảng điều khiển công ty
          </p>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            Quản lý tuyển dụng
          </h1>
          <p className="text-sm text-muted-foreground">
            Theo dõi tin tuyển dụng và hồ sơ ứng tuyển của công ty.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/company/post-job">
            <Plus className="h-4 w-4" />
            Đăng tin mới
          </Link>
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng tin" value={stats.totalJobs} icon={<Briefcase />} />
        <StatCard label="Đang tuyển" value={stats.activeJobs} icon={<Briefcase />} />
        <StatCard label="Bản nháp" value={stats.draftJobs} icon={<FileText />} />
        <StatCard label="Ứng tuyển mới" value={stats.submittedApplications} icon={<Users />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/40 p-5">
          <SectionHeader
            title="Tin tuyển dụng gần đây"
            href="/company/jobs"
            action="Xem tất cả"
          />
          <div className="mt-4 space-y-3">
            {overview.recentJobs.length === 0 ? (
              <EmptyLine text="Chưa có tin tuyển dụng nào." />
            ) : (
              overview.recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/company/post-job/${job.id}`}
                  className="block rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {job.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.applicantCount} ứng tuyển
                      </p>
                    </div>
                    <StatusPill status={job.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-2xl border-border/40 p-5">
          <SectionHeader
            title="Ứng tuyển mới"
            href="/company/applications"
            action="Quản lý ứng tuyển"
          />
          <div className="mt-4 space-y-3">
            {overview.recentApplications.length === 0 ? (
              <EmptyLine text="Chưa có hồ sơ ứng tuyển nào." />
            ) : (
              overview.recentApplications.map((app) => (
                <Link
                  key={app.applicationId}
                  href="/company/applications"
                  className="block rounded-xl border border-border/40 p-3 transition-colors hover:bg-muted/40"
                >
                  <p className="truncate text-sm font-semibold text-foreground">
                    {app.applicantName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {app.jobTitle}
                  </p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="rounded-2xl border-border/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
      </div>
    </Card>
  )
}

function SectionHeader({
  action,
  href,
  title,
}: {
  action: string
  href: string
  title: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-headline text-base font-bold text-foreground">{title}</h2>
      <Link href={href} className="text-xs font-semibold text-primary hover:underline">
        {action}
      </Link>
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">{text}</p>
}

function StatusPill({ status }: { status: string }) {
  const label: Record<string, string> = {
    active: "Đang tuyển",
    closed: "Đã đóng",
    draft: "Nháp",
    expired: "Hết hạn",
    removed: "Đã gỡ",
  }
  return (
    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {label[status] ?? status}
    </span>
  )
}
