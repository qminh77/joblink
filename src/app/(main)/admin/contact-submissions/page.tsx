import { requireAdmin } from "@/features/admin/api/admin-guard"
import { loadContactSubmissions } from "@/features/contact/api/admin-actions"
import { AdminContactList } from "@/features/contact/components/admin-contact-list"

export const dynamic = "force-dynamic"

export default async function AdminContactSubmissionsPage() {
  await requireAdmin()
  const items = await loadContactSubmissions()

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yêu cầu liên hệ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các yêu cầu hỗ trợ từ người dùng
          </p>
        </div>
      </header>

      <AdminContactList items={items} />
    </div>
  )
}
