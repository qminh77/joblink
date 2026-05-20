import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { loadConnectionRelation } from "@/features/network/api/queries"
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

  const result = await loadProfileById(targetId)
  if (!result) notFound()

  const relation = await loadConnectionRelation(targetId)

  if (result.kind === "company") {
    return (
      <CompanyProfileView
        company={result.data}
        isOwner={result.data.user_id === current.appUser.id}
        relation={relation}
      />
    )
  }

  return <MemberProfileView profile={result.data} relation={relation} />
}
