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
} from "../types"
import { MIN_SEARCH_QUERY, SEARCH_PREVIEW_LIMIT } from "./constants"
import { mapJobToSearchPage } from "./job-mapper"

export async function searchAllTabAction(
  query: string,
): Promise<{
  people: SearchPeopleResult
  companies: SearchCompaniesResult
  jobs: SearchJobsResult
  posts: SearchPostsResult
}> {
  const q = query.trim()
  if (q.length < MIN_SEARCH_QUERY) {
    return {
      people: { items: [], total: 0 },
      companies: { items: [], total: 0 },
      jobs: { items: [], total: 0 },
      posts: { items: [], total: 0 },
    }
  }
  const current = await requireCurrentUser()
  const supabase = await createClient()

  const [people, companies, posts, jobsPage] = await Promise.all([
    searchPagePeople(
      supabase,
      q,
      current.appUser.id,
      SEARCH_PREVIEW_LIMIT,
      0,
    ),
    searchPageCompanies(supabase, q, SEARCH_PREVIEW_LIMIT, 0),
    searchPosts(supabase, q, SEARCH_PREVIEW_LIMIT, 0),
    loadJobsList({ search: q, limit: SEARCH_PREVIEW_LIMIT }),
  ])

  return {
    people,
    companies,
    jobs: {
      items: jobsPage.items.map(mapJobToSearchPage),
      total: jobsPage.total,
    },
    posts,
  }
}
