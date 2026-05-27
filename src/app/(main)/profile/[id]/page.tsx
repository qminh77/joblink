import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { loadUserPosts } from "@/features/posts/api/queries"
import { loadProfileById } from "@/features/profile/api/queries"
import { CompanyProfileView } from "@/features/profile/components/company-profile-view"
import { MemberProfileView } from "@/features/profile/components/member-profile-view"

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

  const { detail, relation, isOwner } = result

  if (detail.kind === "company") {
    return (
      <CompanyProfileView
        company={detail.data}
        isOwner={isOwner}
        relation={relation}
        postsPage={postsPage}
      />
    )
  }

  return (
    <MemberProfileView
      profile={detail.data}
      relation={relation}
      postsPage={postsPage}
    />
  )
}
