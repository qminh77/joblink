import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import {
  loadOwnCompanyProfile,
  loadOwnMemberProfile,
} from "@/features/profile/api/queries"
import type { SessionUserSummary } from "@/features/auth/types"
import { SettingsTabs } from "@/features/settings/components/settings-tabs"

export default async function SettingsPage() {
  const current = await requireCurrentUser()
  const t = await getTranslations("settings")

  const sessionUser: SessionUserSummary = {
    id: current.appUser.id,
    authId: current.appUser.auth_id,
    email: current.appUser.email,
    role: current.appUser.role,
    status: current.appUser.status,
    displayName: current.profile.displayName,
    avatarUrl: current.profile.avatarUrl,
    headline: current.profile.headline,
  }

  const member =
    current.appUser.role === "member" ? await loadOwnMemberProfile() : null
  const company =
    current.appUser.role === "company" ? await loadOwnCompanyProfile() : null

  const profile =
    member !== null
      ? ({ kind: "member" as const, data: member })
      : company !== null
        ? ({ kind: "company" as const, data: company })
        : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <SettingsTabs
        user={sessionUser}
        profile={profile}
        locale={current.appUser.locale}
      />
    </div>
  )
}
