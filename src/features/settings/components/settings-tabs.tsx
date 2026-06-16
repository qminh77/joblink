"use client"

import { useTranslations } from "next-intl"
import { Ban, Bell, Building2, Globe, Shield, User } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SessionUserSummary } from "@/features/auth/types"
import { CompanyVerificationCard } from "@/features/companies/components/company-verification-card"
import { CompanyInfoForm } from "@/features/profile/components/edit/company-info-form"
import type {
  CompanyProfileDetail,
  MemberProfileDetail,
} from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"

import { AccountInfoCard } from "./account-info-card"
import { BlockedAccountsCard } from "./blocked-accounts-card"
import { OpenToHireCard } from "./open-to-hire-card"
import { PrivacyCard } from "./privacy-card"

type Profile =
  | { kind: "member"; data: MemberProfileDetail }
  | { kind: "company"; data: CompanyProfileDetail }
  | null

const NOTIFICATION_KEYS = [
  "like",
  "comment",
  "newConnection",
  "message",
  "jobMatch",
] as const

const NOTIFICATION_DEFAULTS: Record<(typeof NOTIFICATION_KEYS)[number], boolean> = {
  like: true,
  comment: true,
  newConnection: true,
  message: true,
  jobMatch: false,
}

export function SettingsTabs({
  user,
  profile,
  provinces,
  locale,
}: {
  user: SessionUserSummary
  profile: Profile
  provinces: ProvinceRow[]
  locale: string
}) {
  const t = useTranslations("settings")
  const tn = useTranslations("settings.notifications.items")

  const isCompany = profile?.kind === "company"

  return (
    <Tabs defaultValue={isCompany ? "company" : "account"}>
      <TabsList className="bg-muted/60 p-1 rounded-2xl overflow-x-auto">
        {isCompany ? (
          <TabsTrigger
            value="company"
            className="rounded-lg text-sm px-4 whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 mr-1.5" /> {t("tabs.company")}
          </TabsTrigger>
        ) : null}
        <TabsTrigger
          value="account"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <User className="w-4 h-4 mr-1.5" /> {t("tabs.account")}
        </TabsTrigger>
        <TabsTrigger
          value="privacy"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Shield className="w-4 h-4 mr-1.5" /> {t("tabs.privacy")}
        </TabsTrigger>
        <TabsTrigger
          value="blocked"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Ban className="w-4 h-4 mr-1.5" /> {t("tabs.blocked")}
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Bell className="w-4 h-4 mr-1.5" /> {t("tabs.notifications")}
        </TabsTrigger>
        <TabsTrigger
          value="language"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Globe className="w-4 h-4 mr-1.5" /> {t("tabs.language")}
        </TabsTrigger>
      </TabsList>

      {isCompany && profile?.kind === "company" ? (
        <TabsContent value="company" className="mt-6">
          <Card className="rounded-2xl bg-card border-border/40 p-6">
            <h2 className="font-headline font-bold text-base text-foreground mb-1">
              {t("company.title")}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {t("company.subtitle")}
            </p>
            <CompanyVerificationCard
              status={profile.data.verification_status}
              note={profile.data.verification_note}
            />
            <CompanyInfoForm company={profile.data} provinces={provinces} />
          </Card>
        </TabsContent>
      ) : null}

      <TabsContent value="account" className="mt-6">
        <AccountInfoCard user={user} locale={locale} />
      </TabsContent>

      <TabsContent value="privacy" className="mt-6 space-y-5">
        {profile?.kind === "member" ? (
          <PrivacyCard
            initialVisibility={profile.data.profile_visibility}
            initialOpenToWork={profile.data.open_to_work}
          />
        ) : null}
        {profile?.kind === "company" ? (
          <OpenToHireCard initialValue={profile.data.open_to_hire} />
        ) : null}
      </TabsContent>

      <TabsContent value="blocked" className="mt-6">
        <BlockedAccountsCard />
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-1">
          <h2 className="font-headline font-bold text-base text-foreground mb-1">
            {t("notifications.title")}
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {t("notifications.subtitle")}
          </p>
          {NOTIFICATION_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {tn(key)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tn(`${key}Desc`)}
                </p>
              </div>
              <Switch defaultChecked={NOTIFICATION_DEFAULTS[key]} disabled />
            </div>
          ))}
        </Card>
      </TabsContent>

      <TabsContent value="language" className="mt-6">
        <p className="text-sm text-muted-foreground">
          {t("locale.languageTabHint")}
        </p>
      </TabsContent>
    </Tabs>
  )
}
