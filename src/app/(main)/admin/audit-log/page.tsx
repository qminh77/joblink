import { listAuditLogs, listDistinctActions } from "@/features/admin/api/audit"
import { AuditPanel } from "@/features/admin/components/audit-panel"

export const dynamic = "force-dynamic"

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const action =
    typeof params.action === "string" && params.action !== "all"
      ? params.action
      : undefined
  const entityType =
    typeof params.entity === "string" && params.entity !== "all"
      ? params.entity
      : undefined

  const [entries, actions] = await Promise.all([
    listAuditLogs({ search, action, entityType, limit: 200 }),
    listDistinctActions(),
  ])

  return (
    <AuditPanel
      entries={entries}
      actions={actions}
      query={{ search, action, entityType }}
    />
  )
}
