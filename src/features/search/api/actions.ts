"use server"

import { searchAllTabAction as searchAllTab } from "./all-tab-search"
import { globalSearchAction as globalSearch } from "./global-search"
import {
  searchPageAction as searchPage,
  type SearchPageFilters,
} from "./page-search"
import type { SearchTab } from "../types"

export async function globalSearchAction(
  query: Parameters<typeof globalSearch>[0],
) {
  return globalSearch(query)
}

export async function searchPageAction(
  query: Parameters<typeof searchPage>[0],
  tab: SearchTab,
  offset: Parameters<typeof searchPage>[2],
  filters?: SearchPageFilters,
) {
  return searchPage(query, tab, offset, filters)
}

export async function searchAllTabAction(
  query: Parameters<typeof searchAllTab>[0],
) {
  return searchAllTab(query)
}
