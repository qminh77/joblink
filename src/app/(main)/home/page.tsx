import { Suspense } from "react"

import { HomeContent } from "@/features/posts/components/home-content"
import { HomeSkeleton } from "@/features/posts/components/home-skeleton"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function HomeFeedPage() {
  await requirePermission("feed.view")
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
