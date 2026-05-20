import { Suspense } from "react"

import { NetworkContent } from "@/features/network/components/network-content"
import { NetworkSkeleton } from "@/features/network/components/network-skeleton"

export default function NetworkPage() {
  return (
    <Suspense fallback={<NetworkSkeleton />}>
      <NetworkContent />
    </Suspense>
  )
}
