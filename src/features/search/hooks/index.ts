"use client"

import { useQuery } from "@tanstack/react-query"

import { globalSearchAction } from "../api/actions"
import type { GlobalSearchResults } from "../types"

const EMPTY: GlobalSearchResults = { people: [], companies: [], jobs: [] }

// query nên là giá trị ĐÃ debounce ở component. Chỉ chạy khi >= 2 ký tự.
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
