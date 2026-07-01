import { SearchPageClient } from "@/features/search/components/search-page-client"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = "force-dynamic"

export default async function SearchRoute({ searchParams }: Props) {
  await requireCurrentUser()
  const params = await searchParams
  const q = typeof params.q === "string" ? params.q : ""
  return <SearchPageClient initialQuery={q} />
}
