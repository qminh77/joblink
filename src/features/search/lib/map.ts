import type { JobListItem } from "@/features/jobs/types"

import type {
  HeaderCompanyRow,
  HeaderPersonRow,
  SearchPageCompanyRow,
  SearchPagePersonRow,
  SearchPostRow,
} from "../data/search.repo"
import type {
  SearchCompany,
  SearchPageCompany,
  SearchPageJob,
  SearchPagePerson,
  SearchPagePost,
  SearchPerson,
} from "../types"

type PostAuthor = {
  name: string
  avatarUrl: string | null
  role: string
}

export function mapHeaderPerson(row: HeaderPersonRow): SearchPerson | null {
  if (!row.full_name) return null

  return {
    userId: row.user_id,
    name: row.full_name,
    avatarUrl: row.avatar_url,
    headline: row.headline,
  }
}

export function mapHeaderCompany(row: HeaderCompanyRow): SearchCompany | null {
  if (!row.name) return null

  return {
    userId: row.user_id,
    name: row.name,
    logoUrl: row.logo_url,
    industry: row.industry,
  }
}

export function mapSearchPagePerson(
  row: SearchPagePersonRow,
  role: string | undefined,
  connectionStatus: SearchPagePerson["connectionStatus"],
): SearchPagePerson | null {
  const person = mapHeaderPerson(row)
  if (!person) return null

  return {
    ...person,
    role: role === "admin" ? "admin" : "member",
    location: null,
    connectionStatus,
  }
}

export function mapSearchPageCompany(
  row: SearchPageCompanyRow,
): SearchPageCompany | null {
  const company = mapHeaderCompany(row)
  if (!company) return null

  return {
    ...company,
    verified: row.verification_status === "verified",
    description: null,
  }
}

export function mapJobToSearchPage(job: JobListItem): SearchPageJob {
  return {
    id: job.id,
    title: job.title,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryVisible: job.salaryVisible,
    createdAt: job.createdAt,
    companyUserId: job.companyUserId,
    companyName: job.companyName,
    companyLogoUrl: job.companyLogoUrl,
    companyVerified: job.companyVerified,
    provinceName: job.provinceName,
    jobTypeName: job.jobTypeName,
    workModeName: job.workModeName,
    viewerSaved: job.viewerSaved,
  }
}

export function mapSearchPagePost(
  row: SearchPostRow,
  author: PostAuthor | undefined,
): SearchPagePost {
  const fallback = { name: "JobLink", avatarUrl: null, role: "member" }

  return {
    id: row.id,
    authorId: row.author_id,
    content: row.content,
    postType: row.post_type,
    createdAt: row.created_at,
    authorName: author?.name ?? fallback.name,
    authorAvatarUrl: author?.avatarUrl ?? fallback.avatarUrl,
    authorRole: author?.role ?? fallback.role,
    reactionCount: row.reaction_count ?? 0,
    commentCount: row.comment_count ?? 0,
  }
}
