"use server"

import { loadJobsList } from "@/features/jobs/api/queries"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"

import { searchCompanies, searchPeople } from "../data/search.repo"
import type { GlobalSearchResults } from "../types"
import { HEADER_SEARCH_LIMIT, MIN_SEARCH_QUERY } from "./constants"

export async function globalSearchAction(
  query: string,
): Promise<GlobalSearchResults> {
  const q = query.trim()
  if (q.length < MIN_SEARCH_QUERY) {
    return { people: [], companies: [], jobs: [] }
  }
  await requireCurrentUser()
  const supabase = await createClient()

  const [people, companies, jobsPage] = await Promise.all([
    searchPeople(supabase, q, HEADER_SEARCH_LIMIT),
    searchCompanies(supabase, q, HEADER_SEARCH_LIMIT),
    loadJobsList({ search: q, limit: HEADER_SEARCH_LIMIT }),
  ])

  return {
    people,
    companies,
    jobs: jobsPage.items.map((job) => ({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
    })),
  }
}
