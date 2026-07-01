import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { loadProfileEditOverview } from "@/features/profile/api/queries"
import { EditProfileTabs } from "@/features/profile/components/edit/edit-profile-tabs"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

export default async function EditProfilePage() {
  const current = await requireCurrentUser()
  if (current.appUser.role === "company") {
    redirect("/settings")
  }

  const overview = await loadProfileEditOverview()
  if (!overview) {
    redirect("/login")
  }

  const t = await getTranslations("profile.edit")

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground">
          {t("pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("pageSubtitle")}
        </p>
      </div>
      <EditProfileTabs
        profile={overview.profile}
        provinces={overview.provinces}
        cvs={overview.cvs}
      />
    </div>
  )
}
