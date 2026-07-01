import { Suspense } from "react"

import { NetworkContent } from "@/features/network/components/network-content"
import { NetworkSkeleton } from "@/features/network/components/network-skeleton"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

export default async function NetworkPage() {
  await requireCurrentUser()
  return (
    <Suspense fallback={<NetworkSkeleton />}>
      <NetworkContent />
    </Suspense>
  )
}
