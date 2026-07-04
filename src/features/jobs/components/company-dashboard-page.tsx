import Link from "next/link"
import { notFound } from "next/navigation"
import {
  AlertCircle,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  Pencil,
  Plus,
  Settings,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { profileHref } from "@/lib/utils/profile-url"

import { loadCompanyDashboard } from "../api/company-management"
import { formatLocation } from "../lib/format"
import type {
  CompanyApplicationItem,
  CompanyDashboardOverview,
  CompanyJobItem,
} from "../types"

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

  return (
    <CompanyDashboard
      overview={overview}
      company={{
        id: current.appUser.id,
        industry: current.profile.headline,
        logoUrl: current.profile.avatarUrl,
        name: current.profile.displayName,
      }}
    />
  )
}

function CompanyDashboard({
  company,
  overview,
}: {
  company: {
    id: number
    industry: string | null
    logoUrl: string | null
    name: string
  }
  overview: CompanyDashboardOverview
}) {
  const { stats } = overview

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-4 border-b border-border/40 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Avatar className="h-14 w-14 rounded-xl border border-border/50">
            {company.logoUrl ? (
              <AvatarImage src={company.logoUrl} alt={company.name} />
            ) : null}
            <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
              <Building2 className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Trung tâm tuyển dụng
            </p>
            <h1 className="truncate font-headline text-2xl font-bold text-foreground">
              {company.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã xác minh
              </span>
              {company.industry ? <span>{company.industry}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-lg">
            <Link href={`/company/${company.id}`}>
              <Eye className="h-4 w-4" />
              Trang công ty
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-lg">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              Cập nhật hồ sơ
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href="/company/post-job">
              <Plus className="h-4 w-4" />
              Đăng tin mới
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          href="/company/jobs"
          icon={<Briefcase />}
          label="Tin đang tuyển"
          tone="primary"
          value={stats.activeJobs}
        />
        <StatCard
          href="/company/applications"
          icon={<Users />}
          label="Hồ sơ đã nộp"
          tone="success"
          value={stats.submittedApplications}
        />
        <StatCard
          href="/company/jobs"
          icon={<FileText />}
          label="Tin nháp"
          tone="warning"
          value={stats.draftJobs}
        />
        <StatCard
          href="/company/jobs"
          icon={<ClipboardList />}
          label="Tổng hồ sơ"
          tone="muted"
          value={stats.totalApplications}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.8fr)]">
        <section className="space-y-5">
          <AttentionPanel overview={overview} />
          <RecentJobsSection jobs={overview.recentJobs} />
        </section>

        <section className="space-y-5">
          <QuickActions />
          <ApplicationSummary stats={stats} />
          <RecentApplicationsSection applications={overview.recentApplications} />
        </section>
      </div>
    </div>
  )
}

function StatCard({
  href,
  icon,
  label,
  tone,
  value,
}: {
  href: string
  icon: React.ReactNode
  label: string
  tone: "muted" | "primary" | "success" | "warning"
  value: number
}) {
  const toneClass = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  }[tone]

  return (
    <Link href={href} className="block">
      <Card className="rounded-xl border-border/40 p-4 transition-colors hover:bg-muted/35">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
            <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function AttentionPanel({
  overview,
}: {
  overview: CompanyDashboardOverview
}) {
  const items = [
    ...overview.attention.draftJobs.map((job) => ({
      action: "Hoàn tất tin",
      description: "Tin đang ở trạng thái nháp, chưa hiển thị công khai.",
      href: `/company/post-job/${job.id}`,
      icon: <FileText className="h-4 w-4" />,
      key: `draft-${job.id}`,
      title: job.title,
    })),
    ...overview.attention.expiringJobs.map((job) => ({
      action: "Kiểm tra hạn",
      description: job.expiresAt
        ? `Tin sẽ hết hạn ${formatDueDate(job.expiresAt)}.`
        : "Tin đang tuyển chưa có thời hạn.",
      href: `/company/post-job/${job.id}`,
      icon: <CalendarClock className="h-4 w-4" />,
      key: `expiring-${job.id}`,
      title: job.title,
    })),
  ]

  return (
    <Card className="rounded-xl border-border/40 p-5">
      <SectionHeading
        action="Quản lý tin"
        href="/company/jobs"
        icon={<AlertCircle className="h-4 w-4" />}
        title="Việc cần chú ý"
      />
      {items.length === 0 ? (
        <p className="mt-4 rounded-lg bg-muted/35 p-4 text-sm text-muted-foreground">
          Không có tin nháp hoặc tin sắp hết hạn trong 7 ngày tới.
        </p>
      ) : (
        <div className="mt-4 divide-y divide-border/40">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-start gap-3 py-3 transition-colors hover:bg-muted/30"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300">
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {item.action}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

function RecentJobsSection({ jobs }: { jobs: CompanyJobItem[] }) {
  return (
    <Card className="rounded-xl border-border/40 p-5">
      <SectionHeading
        action="Xem tất cả"
        href="/company/jobs"
        icon={<Briefcase className="h-4 w-4" />}
        title="Tin tuyển dụng gần đây"
      />
      {jobs.length === 0 ? (
        <EmptyState
          actionHref="/company/post-job"
          actionText="Tạo tin đầu tiên"
          text="Chưa có tin tuyển dụng nào."
        />
      ) : (
        <div className="mt-4 divide-y divide-border/40">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </Card>
  )
}

function JobRow({ job }: { job: CompanyJobItem }) {
  const location = formatLocation({
    provinceName: job.provinceName,
    wardName: job.wardName,
  })

  return (
    <div className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/company/post-job/${job.id}`}
            className="truncate text-sm font-semibold text-foreground hover:text-primary"
          >
            {job.title}
          </Link>
          <JobStatusPill status={job.status} />
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {job.jobTypeName ? <span>{job.jobTypeName}</span> : null}
          {job.workModeName ? <span>{job.workModeName}</span> : null}
          {location ? <span>{location}</span> : null}
          <Link
            href={`/company/applications?job=${job.id}`}
            className="font-medium text-primary hover:underline"
          >
            {job.applicantCount} hồ sơ
          </Link>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <Link href={`/jobs/${job.id}`}>
            <Eye className="h-4 w-4" />
            Xem
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <Link href={`/company/post-job/${job.id}`}>
            <Pencil className="h-4 w-4" />
            Sửa
          </Link>
        </Button>
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <Card className="rounded-xl border-border/40 p-5">
      <h2 className="font-headline text-base font-bold text-foreground">
        Thao tác nhanh
      </h2>
      <div className="mt-4 grid gap-2">
        <Button asChild className="justify-start rounded-lg">
          <Link href="/company/post-job">
            <Plus className="h-4 w-4" />
            Đăng tin tuyển dụng
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start rounded-lg">
          <Link href="/company/jobs">
            <Briefcase className="h-4 w-4" />
            Quản lý tin tuyển dụng
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start rounded-lg">
          <Link href="/company/applications">
            <Users className="h-4 w-4" />
            Xem hồ sơ ứng tuyển
          </Link>
        </Button>
        <Button asChild variant="outline" className="justify-start rounded-lg">
          <Link href="/settings">
            <Building2 className="h-4 w-4" />
            Cập nhật hồ sơ công ty
          </Link>
        </Button>
      </div>
    </Card>
  )
}

function ApplicationSummary({
  stats,
}: {
  stats: CompanyDashboardOverview["stats"]
}) {
  return (
    <Card className="rounded-xl border-border/40 p-5">
      <SectionHeading
        action="Tất cả hồ sơ"
        href="/company/applications"
        icon={<ClipboardList className="h-4 w-4" />}
        title="Hồ sơ ứng tuyển"
      />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniMetric label="Đã nộp" value={stats.submittedApplications} />
        <MiniMetric label="Đã rút" value={stats.withdrawnApplications} />
        <MiniMetric label="Đã đóng" value={stats.closedApplications} />
      </div>
    </Card>
  )
}

function RecentApplicationsSection({
  applications,
}: {
  applications: CompanyApplicationItem[]
}) {
  return (
    <Card className="rounded-xl border-border/40 p-5">
      <SectionHeading
        action="Quản lý"
        href="/company/applications"
        icon={<Users className="h-4 w-4" />}
        title="Hồ sơ mới nhận"
      />
      {applications.length === 0 ? (
        <EmptyState text="Chưa có hồ sơ ứng tuyển nào." />
      ) : (
        <div className="mt-4 divide-y divide-border/40">
          {applications.map((app) => (
            <ApplicationRow key={app.applicationId} application={app} />
          ))}
        </div>
      )}
    </Card>
  )
}

function ApplicationRow({
  application,
}: {
  application: CompanyApplicationItem
}) {
  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 rounded-lg">
          {application.applicantAvatarUrl ? (
            <AvatarImage
              src={application.applicantAvatarUrl}
              alt={application.applicantName}
            />
          ) : null}
          <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
            <Users className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={profileHref(application.applicantId, "member")}
              className="truncate text-sm font-semibold text-foreground hover:text-primary"
            >
              {application.applicantName}
            </Link>
            <ApplicationStatusPill status={application.status} />
          </div>
          <Link
            href={`/jobs/${application.jobId}`}
            className="mt-0.5 block truncate text-xs text-primary hover:underline"
          >
            {application.jobTitle}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nộp ngày {formatDate(application.appliedAt)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pl-12">
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <Link href={`/company/applications?job=${application.jobId}`}>
            <FileText className="h-4 w-4" />
            Xem hồ sơ
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="rounded-lg">
          <Link href={profileHref(application.applicantId, "member")}>
            <Eye className="h-4 w-4" />
            Hồ sơ cá nhân
          </Link>
        </Button>
      </div>
    </div>
  )
}

function SectionHeading({
  action,
  href,
  icon,
  title,
}: {
  action: string
  href: string
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-headline text-base font-bold text-foreground">
        <span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        {title}
      </h2>
      <Link href={href} className="text-xs font-semibold text-primary hover:underline">
        {action}
      </Link>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}

function EmptyState({
  actionHref,
  actionText,
  text,
}: {
  actionHref?: string
  actionText?: string
  text: string
}) {
  return (
    <div className="mt-4 rounded-lg bg-muted/35 p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {actionHref && actionText ? (
        <Button asChild className="mt-3 rounded-lg" size="sm">
          <Link href={actionHref}>{actionText}</Link>
        </Button>
      ) : null}
    </div>
  )
}

function JobStatusPill({ status }: { status: CompanyJobItem["status"] }) {
  const label: Record<CompanyJobItem["status"], string> = {
    active: "Đang tuyển",
    closed: "Đã đóng",
    draft: "Nháp",
    expired: "Hết hạn",
    removed: "Đã gỡ",
  }
  return <StatusPill>{label[status]}</StatusPill>
}

function ApplicationStatusPill({
  status,
}: {
  status: CompanyApplicationItem["status"]
}) {
  const label: Record<CompanyApplicationItem["status"], string> = {
    closed: "Đã đóng",
    submitted: "Đã nộp",
    withdrawn: "Đã rút",
  }
  return <StatusPill>{label[status]}</StatusPill>
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatDueDate(value: string) {
  const days = Math.ceil(
    (new Date(value).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  )
  if (days <= 0) return "hôm nay"
  if (days === 1) return "ngày mai"
  return `trong ${days} ngày`
}
