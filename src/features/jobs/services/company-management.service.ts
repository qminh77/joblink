import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { JobApplicationRow, JobRow } from "@/types/database"

import {
  countCompanyApplications,
  countCompanyJobRows,
  listApplicantProfiles,
  listCompanyApplicationRows,
  listCompanyJobApplicationCounts,
  listCompanyJobRows,
  listExpiringCompanyJobRows,
  listJobTypeNames,
  listProvinceNames,
  listRecentCompanyApplicationRows,
  listWardNames,
  listWorkModeNames,
  type CompanyApplicationFilters,
  type CompanyApplicationRecord,
  type CompanyApplicationWithJobRecord,
  type CompanyJobFilters,
  type CompanyJobRecord,
} from "../data/company-management.repo"
import type {
  CompanyApplicationItem,
  CompanyApplicationsPage,
  CompanyDashboardOverview,
  CompanyJobItem,
  CompanyJobsPage,
} from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>

function uniqueNumbers(values: Array<number | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is number => typeof value === "number")),
  )
}

function mapById<T extends { id: number }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]))
}

function mapByUserId<T extends { user_id: number }>(rows: T[]) {
  return new Map(rows.map((row) => [row.user_id, row]))
}

async function hydrateCompanyJobs(
  supabase: Supabase,
  rows: CompanyJobRecord[],
): Promise<CompanyJobItem[]> {
  const jobIds = rows.map((row) => row.id)
  const [counts, jobTypes, workModes, provinces, wards] = await Promise.all([
    listCompanyJobApplicationCounts(supabase, jobIds),
    listJobTypeNames(supabase, uniqueNumbers(rows.map((row) => row.job_type_id))),
    listWorkModeNames(supabase, uniqueNumbers(rows.map((row) => row.work_mode_id))),
    listProvinceNames(supabase, uniqueNumbers(rows.map((row) => row.province_id))),
    listWardNames(supabase, uniqueNumbers(rows.map((row) => row.ward_id))),
  ])

  const countMap = new Map(counts.map((row) => [row.job_id, row.count]))
  const jobTypeMap = mapById(jobTypes)
  const workModeMap = mapById(workModes)
  const provinceMap = mapById(provinces)
  const wardMap = mapById(wards)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    salaryVisible: row.salary_visible,
    applicantCount: countMap.get(row.id) ?? 0,
    jobTypeName: jobTypeMap.get(row.job_type_id)?.name ?? null,
    workModeName: workModeMap.get(row.work_mode_id)?.name ?? null,
    provinceName: row.province_id ? provinceMap.get(row.province_id)?.name ?? null : null,
    wardName: row.ward_id ? wardMap.get(row.ward_id)?.name ?? null : null,
  }))
}

function applicationStatusValue(status: JobApplicationRow["status"]) {
  return status
}

async function hydrateApplications(
  rows: CompanyApplicationRecord[],
  jobs: CompanyJobRecord[],
  supabase: Supabase,
): Promise<CompanyApplicationItem[]> {
  const jobMap = new Map(jobs.map((job) => [job.id, job]))
  const profiles = await listApplicantProfiles(
    supabase,
    uniqueNumbers(rows.map((row) => row.applicant_id)),
  )
  const profileMap = mapByUserId(profiles)

  return rows.map((row) => {
    const profile = profileMap.get(row.applicant_id)
    const job = jobMap.get(row.job_id)
    return {
      applicationId: row.id,
      jobId: row.job_id,
      jobTitle: job?.title ?? "Tin tuyển dụng",
      applicantId: row.applicant_id,
      applicantName: profile?.full_name ?? "Ứng viên",
      applicantAvatarUrl: profile?.avatar_url ?? null,
      applicantHeadline: profile?.headline ?? null,
      status: applicationStatusValue(row.status),
      appliedAt: row.applied_at,
      updatedAt: row.updated_at,
      coverLetter: row.cover_letter,
      resumeAvailable: Boolean(row.resume_url),
    }
  })
}

async function hydrateRecentApplications(
  rows: CompanyApplicationWithJobRecord[],
  supabase: Supabase,
): Promise<CompanyApplicationItem[]> {
  const profiles = await listApplicantProfiles(
    supabase,
    uniqueNumbers(rows.map((row) => row.applicant_id)),
  )
  const profileMap = mapByUserId(profiles)

  return rows.map((row) => {
    const profile = profileMap.get(row.applicant_id)
    return {
      applicationId: row.id,
      jobId: row.job_id,
      jobTitle: row.jobs?.title ?? "Tin tuyển dụng",
      applicantId: row.applicant_id,
      applicantName: profile?.full_name ?? "Ứng viên",
      applicantAvatarUrl: profile?.avatar_url ?? null,
      applicantHeadline: profile?.headline ?? null,
      status: applicationStatusValue(row.status),
      appliedAt: row.applied_at,
      updatedAt: row.updated_at,
      coverLetter: row.cover_letter,
      resumeAvailable: Boolean(row.resume_url),
    }
  })
}

export async function loadCompanyJobsPage(
  supabase: Supabase,
  companyUserId: number,
  filters: CompanyJobFilters = {},
): Promise<CompanyJobsPage> {
  const { rows, count, error } = await listCompanyJobRows(
    supabase,
    companyUserId,
    filters,
  )
  if (error) {
    console.error("[loadCompanyJobsPage]", error)
    return { items: [], total: 0 }
  }
  return { items: await hydrateCompanyJobs(supabase, rows), total: count }
}

export async function loadCompanyApplicationsPage(
  supabase: Supabase,
  companyUserId: number,
  filters: CompanyApplicationFilters = {},
): Promise<CompanyApplicationsPage> {
  const { rows: jobRows } = await listCompanyJobRows(supabase, companyUserId, {
    limit: 200,
  })
  const scopedJobIds = jobRows.map((job) => job.id)
  const { rows, count, error } = await listCompanyApplicationRows(
    supabase,
    scopedJobIds,
    filters,
  )
  if (error) {
    console.error("[loadCompanyApplicationsPage]", error)
    return { items: [], total: 0, jobs: await hydrateCompanyJobs(supabase, jobRows) }
  }

  return {
    items: await hydrateApplications(rows, jobRows, supabase),
    total: count,
    jobs: await hydrateCompanyJobs(supabase, jobRows),
  }
}

export async function loadCompanyDashboardOverview(
  supabase: Supabase,
  companyUserId: number,
): Promise<CompanyDashboardOverview> {
  const [
    totalJobs,
    activeJobs,
    draftJobs,
    closedJobs,
    expiredJobs,
    totalApplications,
    submittedApplications,
    withdrawnApplications,
    closedApplications,
    recentJobs,
    draftPreview,
    expiringPreview,
    recentApplications,
  ] = await Promise.all([
    countCompanyJobRows(supabase, companyUserId),
    countCompanyJobRows(supabase, companyUserId, "active"),
    countCompanyJobRows(supabase, companyUserId, "draft"),
    countCompanyJobRows(supabase, companyUserId, "closed"),
    countCompanyJobRows(supabase, companyUserId, "expired"),
    countCompanyApplications(supabase, companyUserId),
    countCompanyApplications(supabase, companyUserId, "submitted"),
    countCompanyApplications(supabase, companyUserId, "withdrawn"),
    countCompanyApplications(supabase, companyUserId, "closed"),
    listCompanyJobRows(supabase, companyUserId, { limit: 5 }),
    listCompanyJobRows(supabase, companyUserId, { status: "draft", limit: 3 }),
    listExpiringCompanyJobRows(supabase, companyUserId, 3),
    listRecentCompanyApplicationRows(supabase, companyUserId, 5),
  ])

  return {
    stats: {
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      expiredJobs,
      totalApplications,
      submittedApplications,
      withdrawnApplications,
      closedApplications,
    },
    attention: {
      draftJobs: await hydrateCompanyJobs(supabase, draftPreview.rows),
      expiringJobs: await hydrateCompanyJobs(supabase, expiringPreview.rows),
    },
    recentJobs: await hydrateCompanyJobs(supabase, recentJobs.rows),
    recentApplications: await hydrateRecentApplications(
      recentApplications.rows,
      supabase,
    ),
  }
}

export type CompanyJobStatus = JobRow["status"]
