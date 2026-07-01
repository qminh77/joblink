"use client"

import { ReportDialog } from "@/features/reports/components/report-dialog"

import { ApplyDialog } from "../apply-dialog"
import { JobSendModal } from "../job-send-modal"
import { JobShareModal } from "../job-share-modal"
import type { ApplyResult } from "../../types"

type JobDetailDialogsProps = {
  companyName: string
  jobId: number
  jobTitle: string
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
  companyName,
  jobId,
  jobTitle,
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
        jobId={jobId}
        jobTitle={jobTitle}
        companyName={companyName}
        open={showApply}
        onApplied={onApplied}
        onClose={onCloseApply}
      />

      <ReportDialog
        open={showReport}
        onClose={onCloseReport}
        targetType="job"
        targetId={jobId}
      />

      <JobShareModal
        jobId={jobId}
        jobTitle={jobTitle}
        companyName={companyName}
        open={showShare}
        onClose={onCloseShare}
      />

      <JobSendModal
        jobId={jobId}
        jobTitle={jobTitle}
        companyName={companyName}
        open={showSend}
        onClose={onCloseSend}
      />
    </>
  )
}
