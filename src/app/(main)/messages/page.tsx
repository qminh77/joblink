import { Suspense } from "react"

import { MessagingPageClient } from "@/features/messaging/components/messaging-page-client"
import { loadMessagingOverview } from "@/features/messaging/api/queries"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

import MessagesLoading from "./loading"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  await requireCurrentUser()
  return (
    <Suspense fallback={<MessagesLoading />}>
      <MessagesContent />
    </Suspense>
  )
}

async function MessagesContent() {
  const overview = await loadMessagingOverview()
  return <MessagingPageClient initialOverview={overview} />
}
