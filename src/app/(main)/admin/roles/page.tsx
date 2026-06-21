import { listAdminRoles } from "@/features/admin/api/roles"
import { getAllPermissions } from "@/lib/rbac"
import { RolesPanel } from "@/features/admin/components/roles-panel"

export const dynamic = "force-dynamic"

export default async function AdminRolesPage() {
  const [items, allPermissions] = await Promise.all([
    listAdminRoles(),
    getAllPermissions(),
  ])

  return (
    <RolesPanel
      items={items}
      allPermissions={allPermissions.map((p) => ({
        name: p.name,
        module_name: p.module_name,
        action_name: p.action_name,
      }))}
    />
  )
}
