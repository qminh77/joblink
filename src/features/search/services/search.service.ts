import "server-only"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { loadJobsList } from "@/features/jobs/api/queries"
import { createClient } from "@/lib/supabase/server"

import {
  listCompanyIdentityRows,
  listHeaderCompanyRows,
  listHeaderPeopleRows,
  listMemberIdentityRows,
  listSearchPageCompanyRows,
  listSearchPagePersonRows,
  listSearchPostRows,
  listUserRoleRows,
  listViewerConnectionRows,
  type SearchConnectionRow,
} from "../data/search.repo"
import {
  mapHeaderCompany,
  mapHeaderPerson,
  mapJobToSearchPage,
  mapSearchPageCompany,
  mapSearchPagePerson,
  mapSearchPagePost,
} from "../lib/map"
import {
  HEADER_SEARCH_LIMIT,
  MIN_SEARCH_QUERY,
  SEARCH_PAGE_SIZE,
  SEARCH_PREVIEW_LIMIT,
} from "../lib/constants"
import type {
  GlobalSearchResults,
  SearchCompaniesResult,
  SearchCompany,
  SearchFilters,
  SearchJob,
  SearchJobsResult,
  SearchPeopleResult,
  SearchPerson,
  SearchPostsResult,
  SearchTab,
} from "../types"

type Supabase = Awaited<ReturnType<typeof createClient>>
type Author = { name: string; avatarUrl: string | null; role: string }

export async function loadGlobalSearchResults(
  query: string,
): Promise<GlobalSearchResults> {
  const q = normalizeQuery(query)
  if (!q) return { people: [], companies: [], jobs: [] }

  await requireCurrentUser()
  const supabase = await createClient()

  const [people, companies, jobs] = await Promise.all([
    loadHeaderPeopleResults(supabase, q, HEADER_SEARCH_LIMIT),
    loadHeaderCompanyResults(supabase, q, HEADER_SEARCH_LIMIT),
    loadHeaderJobResults(q, HEADER_SEARCH_LIMIT),
  ])

  return { people, companies, jobs }
}

export async function loadSearchPageResults(
  query: string,
  tab: SearchTab,
  offset: number,
  filters?: SearchFilters,
): Promise<
  | SearchPeopleResult
  | SearchCompaniesResult
  | SearchJobsResult
  | SearchPostsResult
> {
  const q = normalizeQuery(query)
  if (!q) return { items: [], total: 0 }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  switch (tab) {
    case "people":
      return loadPeopleSearchPage(
        supabase,
        q,
        current.appUser.id,
        SEARCH_PAGE_SIZE,
        offset,
      )
    case "companies":
      return loadCompanySearchPage(supabase, q, SEARCH_PAGE_SIZE, offset)
    case "jobs":
      return loadJobSearchPage(q, SEARCH_PAGE_SIZE, offset, filters)
    case "posts":
      return loadPostSearchPage(supabase, q, SEARCH_PAGE_SIZE, offset)
    default:
      return { items: [], total: 0 }
  }
}

export async function loadAllTabSearchResults(query: string): Promise<{
  people: SearchPeopleResult
  companies: SearchCompaniesResult
  jobs: SearchJobsResult
  posts: SearchPostsResult
}> {
  const q = normalizeQuery(query)
  if (!q) {
    return {
      people: { items: [], total: 0 },
      companies: { items: [], total: 0 },
      jobs: { items: [], total: 0 },
      posts: { items: [], total: 0 },
    }
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const [people, companies, posts, jobs] = await Promise.all([
    loadPeopleSearchPage(
      supabase,
      q,
      current.appUser.id,
      SEARCH_PREVIEW_LIMIT,
      0,
    ),
    loadCompanySearchPage(supabase, q, SEARCH_PREVIEW_LIMIT, 0),
    loadPostSearchPage(supabase, q, SEARCH_PREVIEW_LIMIT, 0),
    loadJobSearchPage(q, SEARCH_PREVIEW_LIMIT, 0),
  ])

  return { people, companies, jobs, posts }
}

function normalizeQuery(query: string): string | null {
  const q = query.trim()
  return q.length >= MIN_SEARCH_QUERY ? q : null
}

async function loadHeaderPeopleResults(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<SearchPerson[]> {
  const rows = await listHeaderPeopleRows(supabase, q, limit)
  return rows.flatMap((row) => {
    const person = mapHeaderPerson(row)
    return person ? [person] : []
  })
}

async function loadHeaderCompanyResults(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<SearchCompany[]> {
  const rows = await listHeaderCompanyRows(supabase, q, limit)
  return rows.flatMap((row) => {
    const company = mapHeaderCompany(row)
    return company ? [company] : []
  })
}

async function loadHeaderJobResults(
  q: string,
  limit: number,
): Promise<SearchJob[]> {
  const jobsPage = await loadJobsList({ search: q, limit })

  return jobsPage.items.map((job) => ({
    id: job.id,
    title: job.title,
    companyName: job.companyName,
  }))
}

async function loadPeopleSearchPage(
  supabase: Supabase,
  q: string,
  currentUserId: number,
  limit: number,
  offset: number,
): Promise<SearchPeopleResult> {
  const { rows, total } = await listSearchPagePersonRows(
    supabase,
    q,
    limit,
    offset,
  )
  const visibleRows = rows.filter((row) => row.full_name)
  if (visibleRows.length === 0) return { items: [], total }

  const userIds = visibleRows.map((row) => row.user_id)
  const [roleRows, connectionRows] = await Promise.all([
    listUserRoleRows(supabase, userIds),
    listViewerConnectionRows(supabase, currentUserId, userIds),
  ])
  const roleMap = new Map(roleRows.map((row) => [row.id, row.role]))
  const connectionMap = buildConnectionMap(currentUserId, connectionRows)

  return {
    items: visibleRows.flatMap((row) => {
      const person = mapSearchPagePerson(
        row,
        roleMap.get(row.user_id),
        connectionMap.get(row.user_id) ?? "none",
      )
      return person ? [person] : []
    }),
    total,
  }
}

async function loadCompanySearchPage(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<SearchCompaniesResult> {
  const { rows, total } = await listSearchPageCompanyRows(
    supabase,
    q,
    limit,
    offset,
  )

  return {
    items: rows.flatMap((row) => {
      const company = mapSearchPageCompany(row)
      return company ? [company] : []
    }),
    total,
  }
}

async function loadJobSearchPage(
  q: string,
  limit: number,
  offset: number,
  filters?: SearchFilters,
): Promise<SearchJobsResult> {
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
    items: result.items.map(mapJobToSearchPage),
    total: result.total,
  }
}

async function loadPostSearchPage(
  supabase: Supabase,
  q: string,
  limit: number,
  offset: number,
): Promise<SearchPostsResult> {
  const { rows, total } = await listSearchPostRows(supabase, q, limit, offset)
  if (rows.length === 0) return { items: [], total }

  const authorIds = [...new Set(rows.map((row) => row.author_id))]
  const [roleRows, memberRows, companyRows] = await Promise.all([
    listUserRoleRows(supabase, authorIds),
    listMemberIdentityRows(supabase, authorIds),
    listCompanyIdentityRows(supabase, authorIds),
  ])
  const roleMap = new Map(roleRows.map((row) => [row.id, row.role]))
  const authorMap = new Map<number, Author>()

  for (const member of memberRows) {
    authorMap.set(member.user_id, {
      name: member.full_name ?? "JobLink",
      avatarUrl: member.avatar_url,
      role: roleMap.get(member.user_id) ?? "member",
    })
  }
  for (const company of companyRows) {
    if (!authorMap.has(company.user_id)) {
      authorMap.set(company.user_id, {
        name: company.name ?? "JobLink",
        avatarUrl: company.logo_url,
        role: roleMap.get(company.user_id) ?? "company",
      })
    }
  }

  return {
    items: rows.map((row) =>
      mapSearchPagePost(row, authorMap.get(row.author_id)),
    ),
    total,
  }
}

function buildConnectionMap(currentUserId: number, rows: SearchConnectionRow[]) {
  const connectionMap = new Map<number, "pending" | "connected">()

  for (const row of rows) {
    const otherId =
      row.requester_id === currentUserId ? row.receiver_id : row.requester_id
    if (row.status === "accepted") {
      connectionMap.set(otherId, "connected")
    } else if (row.status === "pending" && !connectionMap.has(otherId)) {
      connectionMap.set(otherId, "pending")
    }
  }

  return connectionMap
}
