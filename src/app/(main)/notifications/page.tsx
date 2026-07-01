import { loadNotificationsPageData } from "@/features/notifications/api/queries"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import NotificationsClient from "./notifications-client"

export default async function NotificationsPage() {
  await requireCurrentUser()
  const { items, hasMore } = await loadNotificationsPageData()

  return (
    <NotificationsClient initialItems={items} initialHasMore={hasMore} />
  )
}
