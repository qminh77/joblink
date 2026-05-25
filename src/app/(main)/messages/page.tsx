import { MessagingPageClient } from "@/features/messaging/components/messaging-page-client"
import { loadMessagingOverview } from "@/features/messaging/api/queries"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const overview = await loadMessagingOverview()
  return <MessagingPageClient initialOverview={overview} />
}
