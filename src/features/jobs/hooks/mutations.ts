"use client"

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  applyToJobAction,
  toggleSavedJobAction,
  withdrawApplicationAction,
} from "../api/actions"
import type {
  ApplyResult,
  JobsListPage,
  SavedJobsPage,
  ToggleSavedResult,
  WithdrawResult,
} from "../types"
import { translateJobsError } from "./errors"

type QuerySnapshot<T> = Array<[QueryKey, T | undefined]>

type JobsSnapshot = {
  lists: QuerySnapshot<JobsListPage>
  saved: QuerySnapshot<SavedJobsPage>
}

function snapshotJobs(qc: QueryClient): JobsSnapshot {
  return {
    lists: qc.getQueriesData<JobsListPage>({ queryKey: ["jobs", "list"] }),
    saved: qc.getQueriesData<SavedJobsPage>({ queryKey: ["jobs", "saved"] }),
  }
}

function restoreJobs(qc: QueryClient, snapshot?: JobsSnapshot) {
  if (!snapshot) return
  for (const [key, data] of [...snapshot.lists, ...snapshot.saved]) {
    qc.setQueryData(key, data)
  }
}

function updateJobListItem(
  qc: QueryClient,
  jobId: number,
  updater: (item: JobsListPage["items"][number]) => JobsListPage["items"][number],
) {
  qc.setQueriesData<JobsListPage>({ queryKey: ["jobs", "list"] }, (prev) =>
    prev
      ? {
          ...prev,
          items: prev.items.map((item) =>
            item.id === jobId ? updater(item) : item,
          ),
        }
      : prev,
  )
}

function removeFromSavedJobs(qc: QueryClient, jobId: number) {
  qc.setQueriesData<SavedJobsPage>({ queryKey: ["jobs", "saved"] }, (prev) =>
    prev
      ? {
          ...prev,
          items: prev.items.filter((item) => item.id !== jobId),
          total: Math.max(0, prev.total - 1),
        }
      : prev,
  )
}

export function useApplyToJob() {
  const qc = useQueryClient()
  const tu = useTranslations("jobs.public")
  const te = useTranslations("jobs.errors")

  return useMutation<
    ApplyResult,
    Error,
    { jobId: number; coverLetter?: string | null; resumeCvId: number },
    { snapshot: JobsSnapshot }
  >({
    mutationFn: async (input) => {
      const result = await applyToJobAction(input)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["jobs", "list"] })
      const snapshot = snapshotJobs(qc)
      updateJobListItem(qc, input.jobId, (job) => ({
        ...job,
        viewerApplied: true,
      }))
      return { snapshot }
    },
    onSuccess: (_result, input) => {
      toast.success(tu("applySuccess"))
      updateJobListItem(qc, input.jobId, (job) => ({
        ...job,
        viewerApplied: true,
      }))
      qc.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error, _input, context) => {
      restoreJobs(qc, context?.snapshot)
      toast.error(translateJobsError(te, error.message))
    },
  })
}

export function useWithdrawApplication() {
  const qc = useQueryClient()
  const tu = useTranslations("jobs.public")
  const te = useTranslations("jobs.errors")

  return useMutation<WithdrawResult, Error, number>({
    mutationFn: async (applicationId) => {
      const result = await withdrawApplicationAction(applicationId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success(tu("withdrawSuccess"))
      qc.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error) => {
      toast.error(translateJobsError(te, error.message))
    },
  })
}

export function useToggleSavedJob(options?: { onRollback?: () => void }) {
  const qc = useQueryClient()
  const te = useTranslations("jobs.errors")
  return useMutation<ToggleSavedResult, Error, number, { snapshot: JobsSnapshot }>({
    mutationFn: async (jobId) => {
      const result = await toggleSavedJobAction(jobId)
      if (!result.ok) throw new Error(result.error)
      return result
    },
    onMutate: async (jobId) => {
      await qc.cancelQueries({ queryKey: ["jobs"] })
      const snapshot = snapshotJobs(qc)
      let nextSaved: boolean | null = null

      updateJobListItem(qc, jobId, (job) => {
        nextSaved ??= !job.viewerSaved
        return { ...job, viewerSaved: !job.viewerSaved }
      })

      const wasInSaved = snapshot.saved.some(([, page]) =>
        page?.items.some((item) => item.id === jobId),
      )
      if (nextSaved === false || wasInSaved) {
        removeFromSavedJobs(qc, jobId)
      }

      return { snapshot }
    },
    onSuccess: (result, jobId) => {
      if (!result.ok) return
      updateJobListItem(qc, jobId, (job) => ({
        ...job,
        viewerSaved: result.saved,
      }))
      if (!result.saved) removeFromSavedJobs(qc, jobId)
      qc.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (error, _jobId, context) => {
      restoreJobs(qc, context?.snapshot)
      options?.onRollback?.()
      toast.error(translateJobsError(te, error.message))
    },
  })
}
