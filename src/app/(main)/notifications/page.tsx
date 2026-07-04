import { loadNotificationsPageData } from "@/features/notifications/api/queries"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { NotificationsPageClient } from "@/features/notifications/components/notifications-page-client"

export default async function NotificationsPage() {
  await requireCurrentUser()
  const { items, hasMore } = await loadNotificationsPageData()

  return (
    <NotificationsPageClient initialItems={items} initialHasMore={hasMore} />
  )
}
