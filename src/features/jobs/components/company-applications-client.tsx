"use client"

import Link from "next/link"
import { useState } from "react"
import { Briefcase, FileText, UserRound } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CvViewerDialog } from "@/features/cvs/components/cv-viewer-dialog"
import { profileHref } from "@/lib/utils/profile-url"

import type { CompanyApplicationItem, CompanyJobItem } from "../types"

const STATUS_LABEL: Record<CompanyApplicationItem["status"], string> = {
  closed: "Đã đóng",
  submitted: "Đã nộp",
  withdrawn: "Đã rút",
}

export function CompanyApplicationsClient({
  items,
  jobs,
  total,
}: {
  items: CompanyApplicationItem[]
  jobs: CompanyJobItem[]
  total: number
}) {
  const [viewer, setViewer] = useState<CompanyApplicationItem | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Quản lý công ty
          </p>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            Hồ sơ ứng tuyển
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} hồ sơ ứng tuyển từ {jobs.length} tin tuyển dụng.
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/company/jobs">
            <Briefcase className="h-4 w-4" />
            Quản lý tin
          </Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <Card className="rounded-2xl border-border/40 p-10 text-center">
          <FileText className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chưa có hồ sơ ứng tuyển.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((app) => (
            <Card key={app.applicationId} className="rounded-2xl border-border/40 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar className="h-11 w-11 rounded-xl">
                    {app.applicantAvatarUrl ? (
                      <AvatarImage src={app.applicantAvatarUrl} alt={app.applicantName} />
                    ) : null}
                    <AvatarFallback className="rounded-xl bg-muted text-muted-foreground">
                      <UserRound className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link
                      href={profileHref(app.applicantId, "member")}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {app.applicantName}
                    </Link>
                    {app.applicantHeadline ? (
                      <p className="text-xs text-muted-foreground">{app.applicantHeadline}</p>
                    ) : null}
                    <Link
                      href={`/jobs/${app.jobId}`}
                      className="mt-1 block truncate text-sm text-primary hover:underline"
                    >
                      {app.jobTitle}
                    </Link>
                    {app.coverLetter ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {app.coverLetter}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                    {STATUS_LABEL[app.status]}
                  </span>
                  {app.resumeAvailable ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => setViewer(app)}
                    >
                      <FileText className="h-4 w-4" />
                      Xem CV
                    </Button>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewer ? (
        <CvViewerDialog
          kind="company"
          applicationId={viewer.applicationId}
          open={!!viewer}
          onClose={() => setViewer(null)}
          title={`CV - ${viewer.applicantName}`}
        />
      ) : null}
    </div>
  )
}
