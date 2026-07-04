"use server"

// SRS UC Trace - M05 UC-34 Tim kiem tong hop.
// Flow: navbar search|/search -> search action facade -> search services -> repos/result tabs.

import {
  loadAllTabSearchResults,
  loadGlobalSearchResults,
  loadSearchPageResults,
} from "../services/search.service"
import type { SearchFilters, SearchTab } from "../types"

export async function globalSearchAction(query: string) {
  return loadGlobalSearchResults(query)
}

export async function searchPageAction(
  query: string,
  tab: SearchTab,
  offset: number,
  filters?: SearchFilters,
) {
  return loadSearchPageResults(query, tab, offset, filters)
}

export async function searchAllTabAction(query: string) {
  return loadAllTabSearchResults(query)
}
