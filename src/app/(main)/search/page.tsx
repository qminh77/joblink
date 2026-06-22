import { SearchPageClient } from "@/features/search/components/search-page-client"
import { requirePermission } from "@/lib/rbac"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = "force-dynamic"

export default async function SearchRoute({ searchParams }: Props) {
  await requirePermission("search.view")
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q : ""
  return <SearchPageClient initialQuery={q} />
}
