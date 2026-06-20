import { loadNotificationsPageData } from "@/features/notifications/api/queries"
import NotificationsClient from "./notifications-client"

export default async function NotificationsPage() {
  const { items, hasMore } = await loadNotificationsPageData()

  return (
    <NotificationsClient initialItems={items} initialHasMore={hasMore} />
  )
}
