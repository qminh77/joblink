import { Suspense } from "react"

import { HomeContent } from "@/features/posts/components/home-content"
import { HomeSkeleton } from "@/features/posts/components/home-skeleton"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

export const dynamic = "force-dynamic"

export default async function HomeFeedPage() {
  await requireCurrentUser()
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  )
}
