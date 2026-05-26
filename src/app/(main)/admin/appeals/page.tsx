import { listAdminAppeals } from "@/features/admin/api/appeals"
import { AppealsPanel } from "@/features/admin/components/appeals-panel"
import type { AppealStatus } from "@/types/database"

const VALID: AppealStatus[] = ["pending", "accepted", "rejected"]

export const dynamic = "force-dynamic"

export default async function AdminAppealsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const raw = typeof params.status === "string" ? params.status : undefined
  const status: AppealStatus | "all" | undefined =
    raw && (VALID as string[]).includes(raw)
      ? (raw as AppealStatus)
      : raw === "all"
        ? "all"
        : "pending"
  const items = await listAdminAppeals({
    status: status ?? "all",
    limit: 100,
  })
  return <AppealsPanel items={items} query={{ status }} />
}
