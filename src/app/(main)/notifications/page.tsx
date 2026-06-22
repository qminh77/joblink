import { loadNotificationsPageData } from "@/features/notifications/api/queries"
import { requirePermission } from "@/lib/rbac"
import NotificationsClient from "./notifications-client"

export default async function NotificationsPage() {
  await requirePermission("notifications.view")
  const { items, hasMore } = await loadNotificationsPageData()

  return (
    <NotificationsClient initialItems={items} initialHasMore={hasMore} />
  )
}
