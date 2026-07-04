"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { globalSearchAction, searchAllTabAction, searchPageAction } from "../api/actions"
import type {
  GlobalSearchResults,
  SearchCompaniesResult,
  SearchFilters,
  SearchJobsResult,
  SearchPeopleResult,
  SearchPostsResult,
  SearchTab,
} from "../types"

const EMPTY: GlobalSearchResults = { people: [], companies: [], jobs: [] }

export function useGlobalSearch(query: string) {
  const q = query.trim()
  return useQuery<GlobalSearchResults>({
    queryKey: ["global-search", q],
    queryFn: () => globalSearchAction(q),
    enabled: q.length >= 2,
    initialData: q.length >= 2 ? undefined : EMPTY,
    staleTime: 30_000,
  })
}

export type SearchAllData = {
  people: SearchPeopleResult
  companies: SearchCompaniesResult
  jobs: SearchJobsResult
  posts: SearchPostsResult
}

type SearchTabResult =
  | SearchPeopleResult
  | SearchCompaniesResult
  | SearchJobsResult
  | SearchPostsResult

export function useSearchAllTab(query: string) {
  const q = query.trim()
  return useQuery<SearchAllData>({
    queryKey: ["search-all", q],
    queryFn: () => searchAllTabAction(q),
    enabled: q.length >= 2,
    staleTime: 30_000,
  })
}

export function useSearchTabResults(
  query: string,
  tab: SearchTab,
  offset: number,
  filters?: SearchFilters,
) {
  const q = query.trim()
  return useQuery<
    | SearchPeopleResult
    | SearchCompaniesResult
    | SearchJobsResult
    | SearchPostsResult
  >({
    queryKey: ["search-tab", q, tab, offset, filters],
    queryFn: () => searchPageAction(q, tab, offset, filters),
    enabled: q.length >= 2 && tab !== "all",
    staleTime: 30_000,
  })
}

export function useSearchTabInfiniteResults(
  query: string,
  tab: SearchTab,
  filters?: SearchFilters,
) {
  const q = query.trim()
  return useInfiniteQuery<SearchTabResult>({
    queryKey: ["search-tab", q, tab, filters],
    queryFn: ({ pageParam }) => searchPageAction(q, tab, Number(pageParam), filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce(
        (total, page) => total + page.items.length,
        0,
      )
      return loaded < lastPage.total ? loaded : undefined
    },
    enabled: q.length >= 2 && tab !== "all",
    staleTime: 30_000,
  })
}

export function useSearchMore(
  query: string,
  tab: SearchTab,
  offset: number,
  filters?: SearchFilters,
) {
  const q = query.trim()
  return useQuery({
    queryKey: ["search-more", q, tab, offset, filters],
    queryFn: () => searchPageAction(q, tab, offset, filters),
    enabled: q.length >= 2 && tab !== "all" && offset > 0,
    staleTime: 30_000,
  })
}
