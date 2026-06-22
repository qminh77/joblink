"use server"

import { createClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/rbac"
import { loadJobsList } from "@/features/jobs/api/queries"

import {
  searchCompanies,
  searchPageCompanies,
  searchPagePeople,
  searchPeople,
  searchPosts,
} from "../data/search.repo"
import type {
  GlobalSearchResults,
  SearchCompaniesResult,
  SearchJobsResult,
  SearchPageJob,
  SearchPagePost,
  SearchPeopleResult,
  SearchPostsResult,
  SearchTab,
} from "../types"

const PER_CATEGORY = 5
const MIN_QUERY = 2
const PAGE_SIZE = 20

export async function globalSearchAction(
  query: string,
): Promise<GlobalSearchResults> {
  const q = query.trim()
  if (q.length < MIN_QUERY) {
    return { people: [], companies: [], jobs: [] }
  }
  await requirePermission("search.view")
  const supabase = await createClient()

  const [people, companies, jobsPage] = await Promise.all([
    searchPeople(supabase, q, PER_CATEGORY),
    searchCompanies(supabase, q, PER_CATEGORY),
    loadJobsList({ search: q, limit: PER_CATEGORY }),
  ])

  return {
    people,
    companies,
    jobs: jobsPage.items.map((j) => ({
      id: j.id,
      title: j.title,
      companyName: j.companyName,
    })),
  }
}

export async function searchPageAction(
  query: string,
  tab: SearchTab,
  offset: number,
  filters?: {
    peopleLocation?: string | null
    companyIndustry?: string | null
    jobProvinceId?: number | null
    jobTypeIds?: number[] | null
    workModeIds?: number[] | null
    salaryMin?: number | null
  },
): Promise<
  | SearchPeopleResult
  | SearchCompaniesResult
  | SearchJobsResult
  | SearchPostsResult
> {
  const q = query.trim()
  if (q.length < MIN_QUERY) {
    return { items: [], total: 0 }
  }
  const current = await requirePermission("search.view")
  const supabase = await createClient()

  const limit = PAGE_SIZE

  switch (tab) {
    case "people": {
      return searchPagePeople(supabase, q, current.appUser.id, limit, offset)
    }
    case "companies": {
      return searchPageCompanies(supabase, q, limit, offset)
    }
    case "jobs": {
      const result = await loadJobsList({
        search: q,
        provinceId: filters?.jobProvinceId ?? undefined,
        jobTypeIds: filters?.jobTypeIds ?? undefined,
        workModeIds: filters?.workModeIds ?? undefined,
        salaryMin: filters?.salaryMin ?? undefined,
        limit,
        offset,
      })
      return {
        items: result.items.map(
          (j) =>
            ({
              id: j.id,
              title: j.title,
              salaryMin: j.salaryMin,
              salaryMax: j.salaryMax,
              salaryVisible: j.salaryVisible,
              createdAt: j.createdAt,
              companyUserId: j.companyUserId,
              companyName: j.companyName,
              companyLogoUrl: j.companyLogoUrl,
              companyVerified: j.companyVerified,
              provinceName: j.provinceName,
              jobTypeName: j.jobTypeName,
              workModeName: j.workModeName,
              viewerSaved: j.viewerSaved,
            }) as SearchPageJob,
        ),
        total: result.total,
      }
    }
    case "posts": {
      return searchPosts(supabase, q, limit, offset)
    }
    default: {
      return { items: [], total: 0 }
    }
  }
}

export async function searchAllTabAction(
  query: string,
): Promise<{
  people: SearchPeopleResult
  companies: SearchCompaniesResult
  jobs: SearchJobsResult
  posts: SearchPostsResult
}> {
  const q = query.trim()
  if (q.length < MIN_QUERY) {
    return {
      people: { items: [], total: 0 },
      companies: { items: [], total: 0 },
      jobs: { items: [], total: 0 },
      posts: { items: [], total: 0 },
    }
  }
  const current = await requirePermission("search.view")
  const supabase = await createClient()

  const previewLimit = 3

  const [people, companies, posts, jobsPage] = await Promise.all([
    searchPagePeople(supabase, q, current.appUser.id, previewLimit, 0),
    searchPageCompanies(supabase, q, previewLimit, 0),
    searchPosts(supabase, q, previewLimit, 0),
    loadJobsList({ search: q, limit: previewLimit }),
  ])

  return {
    people,
    companies,
    jobs: {
      items: jobsPage.items.map(
        (j) =>
          ({
            id: j.id,
            title: j.title,
            salaryMin: j.salaryMin,
            salaryMax: j.salaryMax,
            salaryVisible: j.salaryVisible,
            createdAt: j.createdAt,
            companyUserId: j.companyUserId,
            companyName: j.companyName,
            companyLogoUrl: j.companyLogoUrl,
            companyVerified: j.companyVerified,
            provinceName: j.provinceName,
            jobTypeName: j.jobTypeName,
            workModeName: j.workModeName,
            viewerSaved: j.viewerSaved,
          }) as SearchPageJob,
      ),
      total: jobsPage.total,
    },
    posts,
  }
}
