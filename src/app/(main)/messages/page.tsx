import { MessagingPageClient } from "@/features/messaging/components/messaging-page-client"
import { loadMessagingOverview } from "@/features/messaging/api/queries"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  await requirePermission("messages.view")
  const overview = await loadMessagingOverview()
  return <MessagingPageClient initialOverview={overview} />
}
