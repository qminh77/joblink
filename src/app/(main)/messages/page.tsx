import { MessagingPageClient } from "@/features/messaging/components/messaging-page-client"
import { loadMessagingOverview } from "@/features/messaging/api/queries"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  await requireCurrentUser()
  const overview = await loadMessagingOverview()
  return <MessagingPageClient initialOverview={overview} />
}
