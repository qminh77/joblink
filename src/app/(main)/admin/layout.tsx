import { requireAdmin } from "@/features/admin/api/admin-guard"
import { AdminSidebar } from "@/features/admin/components/admin-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return (
    <div className="flex gap-6">
      <AdminSidebar />
      <div className="flex-1 min-w-0 space-y-6">{children}</div>
    </div>
  )
}
