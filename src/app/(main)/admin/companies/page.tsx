import { listAdminCompanies } from "@/features/admin/api/companies"
import { CompaniesPanel } from "@/features/admin/components/companies-panel"
import type { CompanyVerification } from "@/types/database"

export const dynamic = "force-dynamic"

const VALID: Array<CompanyVerification | "all"> = [
  "pending",
  "pending_update",
  "verified",
  "rejected",
  "suspended",
  "all",
]

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const statusRaw =
    typeof params.status === "string" ? params.status : undefined
  const status: CompanyVerification | "all" =
    statusRaw && (VALID as readonly string[]).includes(statusRaw)
      ? (statusRaw as CompanyVerification | "all")
      : "pending"
  const search = typeof params.q === "string" ? params.q : undefined

  const { items, counts } = await listAdminCompanies({
    status,
    search,
    limit: 100,
  })

  return (
    <CompaniesPanel
      items={items}
      counts={counts}
      query={{ status, search }}
    />
  )
}
