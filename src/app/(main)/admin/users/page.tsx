import { listAdminUsers } from "@/features/admin/api/users"
import { listAssignableRoles } from "@/features/admin/api/roles"
import { UsersPanel } from "@/features/admin/components/users-panel"
import {
  USER_STATUSES,
  type UserStatus,
} from "@/lib/constants"

export const dynamic = "force-dynamic"

function asRoleId(v?: string): number | "all" | undefined {
  if (!v) return undefined
  if (v === "all") return "all"
  const roleId = Number(v)
  if (Number.isInteger(roleId) && roleId > 0) return roleId
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
  const roleId = asRoleId(typeof params.role === "string" ? params.role : undefined)
  const status = asStatus(
    typeof params.status === "string" ? params.status : undefined,
  )
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : "1") || 1,
  )

  const data = await listAdminUsers({
    search,
    role: typeof roleId === "number" ? String(roleId) : roleId,
    status,
    page,
    pageSize: 20,
  })

  const roles = await listAssignableRoles()

  return (
    <UsersPanel
      initial={data}
      roles={roles}
      query={{
        search,
        role: typeof roleId === "number" ? String(roleId) : roleId,
        status,
        page,
      }}
    />
  )
}
