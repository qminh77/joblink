"use client"

import { ReportDialog } from "@/features/reports/components/report-dialog"
import type { SharedJobPreview } from "@/features/posts/types"

import { ApplyDialog } from "../apply-dialog"
import { JobSendModal } from "../job-send-modal"
import { JobShareModal } from "../job-share-modal"
import type { ApplyResult } from "../../types"

type JobDetailDialogsProps = {
  job: SharedJobPreview
  showApply: boolean
  showReport: boolean
  showSend: boolean
  showShare: boolean
  onCloseApply: () => void
  onApplied?: (result: Extract<ApplyResult, { ok: true }>) => void
  onCloseReport: () => void
  onCloseSend: () => void
  onCloseShare: () => void
}

export function JobDetailDialogs({
  job,
  showApply,
  showReport,
  showSend,
  showShare,
  onCloseApply,
  onApplied,
  onCloseReport,
  onCloseSend,
  onCloseShare,
}: JobDetailDialogsProps) {
  return (
    <>
      <ApplyDialog
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        open={showApply}
        onApplied={onApplied}
        onClose={onCloseApply}
      />

      <ReportDialog
        open={showReport}
        onClose={onCloseReport}
        targetType="job"
        targetId={job.id}
      />

      <JobShareModal
        job={job}
        open={showShare}
        onClose={onCloseShare}
      />

      <JobSendModal
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        open={showSend}
        onClose={onCloseSend}
      />
    </>
  )
}
