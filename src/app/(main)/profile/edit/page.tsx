import { redirect } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import {
  loadOwnMemberProfile,
  loadProvinces,
} from "@/features/profile/api/queries"
import { EditProfileTabs } from "@/features/profile/components/edit/edit-profile-tabs"

export default async function EditProfilePage() {
  const current = await requireCurrentUser()
  if (current.appUser.role === "company") {
    redirect("/settings")
  }

  const [profile, provinces] = await Promise.all([
    loadOwnMemberProfile(),
    loadProvinces(),
  ])

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground">
          Chỉnh sửa hồ sơ
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quản lý thông tin cá nhân, kinh nghiệm, học vấn và kỹ năng
        </p>
      </div>
      <EditProfileTabs profile={profile} provinces={provinces} />
    </div>
  )
}
