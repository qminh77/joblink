import { requireAdmin, getAdminUserPermissions } from "@/features/admin/api/admin-guard"
import {
  AdminSidebar,
  AdminMobileNav,
} from "@/features/admin/components/admin-sidebar"
import { PermissionsProvider } from "@/lib/rbac/permissions-context"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  const permissions = await getAdminUserPermissions()
  return (
    <PermissionsProvider permissions={permissions}>
      <div className="-mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6">
        <div className="flex flex-col lg:flex-row gap-6 px-3 sm:px-4 md:px-6 lg:px-8">
          <AdminSidebar permissions={permissions} />
          <div className="flex-1 min-w-0 flex flex-col space-y-4 lg:space-y-6">
            <div className="lg:hidden flex items-center h-12 border-b border-border/30 mb-2">
              <AdminMobileNav permissions={permissions} />
              <span className="font-semibold text-sm ml-2">Admin Panel</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </PermissionsProvider>
  )
}
