import { getTranslations } from "next-intl/server"

import { getAdminUserPermissions } from "@/features/admin/api/admin-guard"
import { getAdminEntryHref } from "@/features/admin/lib/admin-navigation"
import { requirePermission } from "@/lib/rbac"
import {
  loadOwnCompanyProfile,
  loadOwnMemberProfile,
  loadProvinces,
} from "@/features/profile/api/queries"
import type { SessionUserSummary } from "@/features/auth/types"
import { SettingsTabs } from "@/features/settings/components/settings-tabs"

export default async function SettingsPage() {
  const current = await requirePermission("settings.view")
  const t = await getTranslations("settings")
  const permissions = await getAdminUserPermissions()

  const sessionUser: SessionUserSummary = {
    id: current.appUser.id,
    authId: current.appUser.auth_id,
    email: current.appUser.email,
    role: current.appUser.role,
    status: current.appUser.status,
    displayName: current.profile.displayName,
    avatarUrl: current.profile.avatarUrl,
    coverUrl: current.profile.coverUrl,
    headline: current.profile.headline,
    permissions,
    adminHref: getAdminEntryHref(permissions),
  }

  const member =
    current.appUser.role === "member" ? await loadOwnMemberProfile() : null
  const company =
    current.appUser.role === "company" ? await loadOwnCompanyProfile() : null
  const provinces =
    current.appUser.role === "company" ? await loadProvinces() : []

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
        phone={current.appUser.phone}
        profile={profile}
        provinces={provinces}
        locale={current.appUser.locale}
      />
    </div>
  )
}
