"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, Eye, FileText, MoreHorizontal, Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { formatSalary } from "../lib/format"
import { useUpdateJobStatus } from "../hooks"
import type { CompanyJobItem } from "../types"

const STATUS_LABEL: Record<CompanyJobItem["status"], string> = {
  active: "Đang tuyển",
  closed: "Đã đóng",
  draft: "Nháp",
  expired: "Hết hạn",
  removed: "Đã gỡ",
}

export function CompanyJobsClient({
  items,
  total,
}: {
  items: CompanyJobItem[]
  total: number
}) {
  const updateStatus = useUpdateJobStatus()

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Quản lý công ty
          </p>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            Tin tuyển dụng
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} tin tuyển dụng thuộc công ty của bạn.
          </p>
        </div>
        <Button asChild className="rounded-xl">
          <Link href="/company/post-job">
            <Plus className="h-4 w-4" />
            Đăng tin mới
          </Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <Card className="rounded-2xl border-border/40 p-10 text-center">
          <Briefcase className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chưa có tin tuyển dụng.</p>
          <Button asChild className="mt-4 rounded-xl" size="sm">
            <Link href="/company/post-job">Tạo tin đầu tiên</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((job) => (
            <JobRow key={job.id} job={job} updateStatus={updateStatus} />
          ))}
        </div>
      )}
    </div>
  )
}

function JobRow({ job, updateStatus }: { job: CompanyJobItem; updateStatus: any }) {
  const router = useRouter()
  const [optimisticStatus, addOptimisticStatus] = React.useOptimistic(
    job.status,
    (_state, nextStatus: CompanyJobItem["status"]) => nextStatus
  )

  const salary = formatSalary({
    salaryMax: job.salaryMax,
    salaryMin: job.salaryMin,
    salaryVisible: job.salaryVisible,
  })

  function update(jobId: number, newStatus: CompanyJobItem["status"]) {
    React.startTransition(async () => {
      addOptimisticStatus(newStatus)
      await updateStatus.mutateAsync({ jobId, newStatus }).then(() => {
        router.refresh()
      }).catch(() => {})
    })
  }

  return (
    <Card className="rounded-2xl border-border/40 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-semibold text-foreground">
              {job.title}
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {STATUS_LABEL[optimisticStatus]}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {job.jobTypeName ? <span>{job.jobTypeName}</span> : null}
            {job.workModeName ? <span>{job.workModeName}</span> : null}
            {salary ? <span>{salary}</span> : null}
            <Link
              href={`/company/applications?job=${job.id}`}
              className="font-medium text-primary hover:underline"
            >
              {job.applicantCount} ứng tuyển
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-lg">
            <Link href={`/jobs/${job.id}`}>
              <Eye className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Xem</span>
              <span className="sm:hidden">Xem</span>
            </Link>
          </Button>
          
          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link href={`/company/post-job/${job.id}`}>
                <Pencil className="h-4 w-4 mr-2" />
                Sửa
              </Link>
            </Button>
            {optimisticStatus === "draft" || optimisticStatus === "closed" ? (
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => update(job.id, "active")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Đăng lại
              </Button>
            ) : null}
            {optimisticStatus === "active" ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-destructive hover:text-destructive"
                onClick={() => update(job.id, "closed")}
              >
                Đóng tin
              </Button>
            ) : null}
          </div>

          {/* Mobile actions */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg py-2">
                  <Link href={`/company/post-job/${job.id}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Sửa
                  </Link>
                </DropdownMenuItem>
                {optimisticStatus === "draft" || optimisticStatus === "closed" ? (
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg py-2"
                    onClick={() => update(job.id, "active")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Đăng lại
                  </DropdownMenuItem>
                ) : null}
                {optimisticStatus === "active" ? (
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg py-2 text-destructive focus:text-destructive"
                    onClick={() => update(job.id, "closed")}
                  >
                    Đóng tin
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  )
}
