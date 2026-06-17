"use server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { loadJobsList } from "@/features/jobs/api/queries"

import { searchCompanies, searchPeople } from "../data/search.repo"
import type { GlobalSearchResults } from "../types"

const PER_CATEGORY = 5
const MIN_QUERY = 2

// Tìm kiếm diện rộng: người dùng + công ty + việc làm, chạy song song. Trả tối
// đa PER_CATEGORY mỗi nhóm cho dropdown header (tối ưu, không trả tràn).
export async function globalSearchAction(
  query: string,
): Promise<GlobalSearchResults> {
  const q = query.trim()
  if (q.length < MIN_QUERY) {
    return { people: [], companies: [], jobs: [] }
  }
  await requireCurrentUser()
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
