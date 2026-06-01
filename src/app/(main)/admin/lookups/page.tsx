import { listLookups } from "@/features/admin/api/lookups"
import { LookupsPanel } from "@/features/admin/components/lookups-panel"
import type { AdminLookupKind, AdminLookupRow } from "@/features/admin/types"

export const dynamic = "force-dynamic"

const ALL_KINDS: AdminLookupKind[] = [
  "provinces",
  "wards",
  "job_types",
  "work_modes",
  "job_positions",
  "report_types",
  "skills",
]

export default async function AdminLookupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const raw = typeof params.kind === "string" ? params.kind : undefined
  const kind: AdminLookupKind =
    raw && (ALL_KINDS as string[]).includes(raw)
      ? (raw as AdminLookupKind)
      : "provinces"

  const results = await Promise.all(ALL_KINDS.map((k) => listLookups(k)))
  const data = Object.fromEntries(
    ALL_KINDS.map((k, i) => [k, results[i]] as const),
  ) as Record<AdminLookupKind, AdminLookupRow[]>

  return <LookupsPanel initialKind={kind} data={data} />
}
