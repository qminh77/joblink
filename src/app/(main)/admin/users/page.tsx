import { listAdminUsers } from "@/features/admin/api/users"
import { UsersPanel } from "@/features/admin/components/users-panel"
import {
  USER_ROLES,
  USER_STATUSES,
  type UserRole,
  type UserStatus,
} from "@/lib/constants"

export const dynamic = "force-dynamic"

function asRole(v?: string): UserRole | "all" | undefined {
  if (!v) return undefined
  if (v === "all") return "all"
  if ((USER_ROLES as readonly string[]).includes(v)) return v as UserRole
  return undefined
}

function asStatus(v?: string): UserStatus | "all" | undefined {
  if (!v) return undefined
  if (v === "all" || (USER_STATUSES as readonly string[]).includes(v))
    return v as UserStatus | "all"
  return undefined
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const search = typeof params.q === "string" ? params.q : undefined
  const role = asRole(typeof params.role === "string" ? params.role : undefined)
  const status = asStatus(
    typeof params.status === "string" ? params.status : undefined,
  )
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : "1") || 1,
  )

  const data = await listAdminUsers({
    search,
    role,
    status,
    page,
    pageSize: 20,
  })

  return (
    <UsersPanel
      initial={data}
      query={{
        search,
        role,
        status,
        page,
      }}
    />
  )
}
