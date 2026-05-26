"use client"

import type {
  DashboardAppStatus,
  DashboardJobStatus,
} from "../../types"

export const JOB_STATUS_TONE: Record<DashboardJobStatus, string> = {
  active: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
  draft: "text-muted-foreground bg-muted",
  closed: "text-red-600 bg-red-50 dark:bg-red-500/10",
  expired: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
  removed: "text-muted-foreground bg-muted line-through",
}

export const APP_STATUS_TONE: Record<DashboardAppStatus, string> = {
  applied: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
  reviewed: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
  interview: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
  offered: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
  hired: "text-green-700 bg-green-100 dark:bg-green-500/15",
  rejected: "text-red-600 bg-red-50 dark:bg-red-500/10",
  withdrawn: "text-muted-foreground bg-muted",
}

/** Trả về các status hợp lệ kế tiếp cho recruiter (loại 'withdrawn'). */
export const APP_STATUS_TRANSITIONS: DashboardAppStatus[] = [
  "applied",
  "reviewed",
  "interview",
  "offered",
  "hired",
  "rejected",
]

export const PIPELINE_STAGES: DashboardAppStatus[] = [
  "applied",
  "reviewed",
  "interview",
  "offered",
  "hired",
]
