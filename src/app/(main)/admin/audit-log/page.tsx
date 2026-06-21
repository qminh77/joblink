import {
  countAuditLogs,
  listAuditLogs,
  listDistinctActions,
  listDistinctEntityTypes,
} from "@/features/admin/api/audit"
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
  const cursor =
    typeof params.cursor === "string" ? Number(params.cursor) || null : null

  const [page, total, actions, entityTypes] = await Promise.all([
    listAuditLogs({ search, action, entityType, cursor }),
    countAuditLogs({ search, action, entityType }),
    listDistinctActions(),
    listDistinctEntityTypes(),
  ])

  return (
    <AuditPanel
      entries={page.items}
      nextCursor={page.nextCursor}
      total={total}
      actions={actions}
      entityTypes={entityTypes}
      query={{ search, action, entityType }}
    />
  )
}
