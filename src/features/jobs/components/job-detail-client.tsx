"use client"

import { useState } from "react"
import { motion } from "framer-motion"

import { fadeUp, pageEntrance } from "@/lib/animations"

import {
  useToggleSavedJob,
  useWithdrawApplication,
} from "../hooks"
import type { JobDetail } from "../types"

import { CompanySidebarCard } from "./job-detail/company-sidebar-card"
import { JobBodyCard } from "./job-detail/job-body-card"
import { JobDetailDialogs } from "./job-detail/job-detail-dialogs"
import { JobSummaryCard } from "./job-detail/job-summary-card"

type Props = {
  detail: JobDetail
}

export function JobDetailClient({ detail }: Props) {
  const [saved, setSaved] = useState(detail.viewer.viewerSaved)
  const [viewer, setViewer] = useState(detail.viewer)
  const [showApply, setShowApply] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showSend, setShowSend] = useState(false)

  const toggle = useToggleSavedJob({
    onRollback: () => setSaved((v) => !v),
  })
  const withdraw = useWithdrawApplication()

  const { job } = detail

  const handleToggleSave = () => {
    if (toggle.isPending) return
    setSaved((v) => !v)
    toggle.mutate(job.id, {
      onSuccess: (result) => {
        if (result.ok) setSaved(result.saved)
      },
    })
  }

  const canApply =
    !viewer.isOwner &&
    !viewer.viewerApplied &&
    job.status === "active" &&
    (job.expiresAt == null || new Date(job.expiresAt) > new Date())

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        <motion.div variants={fadeUp}>
          <JobSummaryCard
            detail={detail}
            saved={saved}
            canApply={canApply}
            savePending={toggle.isPending}
            withdrawPending={withdraw.isPending}
            onApply={() => setShowApply(true)}
            onReport={() => setShowReport(true)}
            onSend={() => setShowSend(true)}
            onShare={() => setShowShare(true)}
            onToggleSave={handleToggleSave}
            onWithdraw={(applicationId) => {
              const previous = viewer
              setViewer({
                ...previous,
                viewerApplied: false,
                applicationId: null,
                applicationStatus: null,
              })
              withdraw.mutate(applicationId, {
                onError: () => setViewer(previous),
              })
            }}
          />
        </motion.div>

        <motion.div variants={fadeUp}>
          <JobBodyCard detail={detail} />
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="lg:col-span-1">
        <CompanySidebarCard detail={detail} />
      </motion.div>

      <JobDetailDialogs
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
        showApply={showApply}
        showReport={showReport}
        showSend={showSend}
        showShare={showShare}
        onCloseApply={() => setShowApply(false)}
        onApplied={(result) =>
          setViewer((current) => ({
            ...current,
            viewerApplied: true,
            applicationId: result.applicationId,
            applicationStatus: result.status,
          }))
        }
        onCloseReport={() => setShowReport(false)}
        onCloseSend={() => setShowSend(false)}
        onCloseShare={() => setShowShare(false)}
      />
    </motion.div>
  )
}
