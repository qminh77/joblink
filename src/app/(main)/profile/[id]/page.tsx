import { notFound, redirect } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { loadProfileById } from "@/features/profile/api/queries"
import { CompanyProfileView } from "@/features/profile/components/company-profile-view"
import { MemberProfileView } from "@/features/profile/components/member-profile-view"

type ProfilePageProps = {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const current = await requireCurrentUser()

  if (id === "me") {
    redirect(`/profile/${current.appUser.id}`)
  }

  const targetId = Number.parseInt(id, 10)
  if (!Number.isFinite(targetId) || targetId <= 0) notFound()

  const result = await loadProfileById(targetId)
  if (!result) notFound()

  if (result.kind === "company") {
    return (
      <CompanyProfileView
        company={result.data}
        isOwner={result.data.user_id === current.appUser.id}
      />
    )
  }

  return <MemberProfileView profile={result.data} />
}
