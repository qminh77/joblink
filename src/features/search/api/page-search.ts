"use server"

import { loadJobsList } from "@/features/jobs/api/queries"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import {
  searchPageCompanies,
  searchPagePeople,
  searchPosts,
} from "../data/search.repo"
import type {
  SearchCompaniesResult,
  SearchJobsResult,
  SearchPeopleResult,
  SearchPostsResult,
  SearchTab,
} from "../types"
import { MIN_SEARCH_QUERY, SEARCH_PAGE_SIZE } from "./constants"
import { mapJobToSearchPage } from "./job-mapper"

export type SearchPageFilters = {
  peopleLocation?: string | null
  companyIndustry?: string | null
  jobProvinceId?: number | null
  jobTypeIds?: number[] | null
  workModeIds?: number[] | null
  salaryMin?: number | null
}

export async function searchPageAction(
  query: string,
  tab: SearchTab,
  offset: number,
  filters?: SearchPageFilters,
): Promise<
  | SearchPeopleResult
  | SearchCompaniesResult
  | SearchJobsResult
  | SearchPostsResult
> {
  const q = query.trim()
  if (q.length < MIN_SEARCH_QUERY) {
    return { items: [], total: 0 }
  }
  const current = await requireCurrentUser()
  const supabase = await createClient()

  switch (tab) {
    case "people":
      return searchPagePeople(
        supabase,
        q,
        current.appUser.id,
        SEARCH_PAGE_SIZE,
        offset,
      )
    case "companies":
      return searchPageCompanies(supabase, q, SEARCH_PAGE_SIZE, offset)
    case "jobs": {
      const result = await loadJobsList({
        search: q,
        provinceId: filters?.jobProvinceId ?? undefined,
        jobTypeIds: filters?.jobTypeIds ?? undefined,
        workModeIds: filters?.workModeIds ?? undefined,
        salaryMin: filters?.salaryMin ?? undefined,
        limit: SEARCH_PAGE_SIZE,
        offset,
      })
      return {
        items: result.items.map(mapJobToSearchPage),
        total: result.total,
      }
    }
    case "posts":
      return searchPosts(supabase, q, SEARCH_PAGE_SIZE, offset)
    default:
      return { items: [], total: 0 }
  }
}
