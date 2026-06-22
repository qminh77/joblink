import { Suspense } from "react"

import { NetworkContent } from "@/features/network/components/network-content"
import { NetworkSkeleton } from "@/features/network/components/network-skeleton"
import { requirePermission } from "@/lib/rbac"

export default async function NetworkPage() {
  await requirePermission("network.view")
  return (
    <Suspense fallback={<NetworkSkeleton />}>
      <NetworkContent />
    </Suspense>
  )
}
