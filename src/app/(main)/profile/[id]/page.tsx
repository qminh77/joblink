import { notFound, redirect } from "next/navigation"

import { loadUserPosts } from "@/features/posts/api/queries"
import { loadProfileById } from "@/features/profile/api/queries"
import { MemberProfileView } from "@/features/profile/components/member-profile-view"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

type ProfilePageProps = {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const rawId = (await params).id
  const current = await requireCurrentUser()

  const id = rawId === "me" ? String(current.appUser.id) : rawId
  const targetId = Number.parseInt(id, 10)
  if (!Number.isFinite(targetId) || targetId <= 0) notFound()

  const [result, postsPage] = await Promise.all([
    loadProfileById(targetId),
    loadUserPosts(targetId),
  ])

  if (!result) notFound()

  // Company dùng trang public riêng /company/[id]; /profile/[id] chỉ phục vụ member.
  if (result.detail.kind === "company") {
    redirect(`/company/${targetId}`)
  }

  const { detail, relation } = result

  return (
    <MemberProfileView
      profile={detail.data}
      relation={relation}
      postsPage={postsPage}
    />
  )
}
