import { Suspense } from "react"

import { HomeContent } from "@/features/posts/components/home-content"
import { HomeSkeleton } from "@/features/posts/components/home-skeleton"

export const dynamic = "force-dynamic"

export default function HomeFeedPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
