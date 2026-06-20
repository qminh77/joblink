"use client"

import { useTranslations } from "next-intl"
import { Ban, Bell, Building2, KeyRound, Shield, ShieldAlert, User } from "lucide-react"

import { Card } from "@/components/ui/card"
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
import { AppealsCard } from "./appeals-card"
import { BlockedAccountsCard } from "./blocked-accounts-card"
import { ChangePasswordCard } from "./change-password-card"
import { NotificationPreferencesCard } from "./notification-preferences-card"
import { OpenToHireCard } from "./open-to-hire-card"
import { PasskeysCard } from "./passkeys-card"
import { PrivacyCard } from "./privacy-card"
import { TwoFactorCard } from "./two-factor-card"

type Profile =
  | { kind: "member"; data: MemberProfileDetail }
  | { kind: "company"; data: CompanyProfileDetail }
  | null

export function SettingsTabs({
  user,
  phone,
  profile,
  provinces,
  locale,
  passkeyEnabled = false,
}: {
  user: SessionUserSummary
  phone: string | null
  profile: Profile
  provinces: ProvinceRow[]
  locale: string
  passkeyEnabled?: boolean
}) {
  const t = useTranslations("settings")

  const isCompany = profile?.kind === "company"

  return (
    <Tabs defaultValue={isCompany ? "company" : "account"} className="flex flex-col md:!flex-row gap-6 lg:gap-10 mt-6">
      <TabsList className="flex flex-row md:!flex-col justify-start !h-auto bg-transparent p-0 w-full md:w-56 shrink-0 overflow-x-auto overflow-y-hidden border-b md:border-b-0 md:border-r border-border/30 rounded-none hide-scrollbar gap-1">
        {isCompany ? (
          <TabsTrigger
            value="company"
            className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
              <Building2 className="w-4 h-4 shrink-0" />
            </div>
            {t("tabs.company")}
          </TabsTrigger>
        ) : null}
        <TabsTrigger
          value="account"
          className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
            <User className="w-4 h-4 shrink-0" />
          </div>
          {t("tabs.account")}
        </TabsTrigger>
        <TabsTrigger
          value="security"
          className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
            <KeyRound className="w-4 h-4 shrink-0" />
          </div>
          Bảo mật & Đăng nhập
        </TabsTrigger>
        <TabsTrigger
          value="privacy"
          className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
            <Shield className="w-4 h-4 shrink-0" />
          </div>
          {t("tabs.privacy")}
        </TabsTrigger>
        <TabsTrigger
          value="blocked"
          className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
            <Ban className="w-4 h-4 shrink-0" />
          </div>
          {t("tabs.blocked")}
        </TabsTrigger>
        <TabsTrigger
          value="appeals"
          className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
            <ShieldAlert className="w-4 h-4 shrink-0" />
          </div>
          {t("tabs.appeals")}
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="group w-full justify-start rounded-xl text-sm px-2.5 py-2 gap-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:font-medium data-[state=active]:shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all border border-transparent whitespace-nowrap"
        >
          <div className="w-8 h-8 rounded-full border border-border/40 bg-muted/40 text-muted-foreground flex items-center justify-center shrink-0 transition-colors group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground group-data-[state=active]:border-primary/20 group-hover:bg-muted/80">
            <Bell className="w-4 h-4 shrink-0" />
          </div>
          {t("tabs.notifications")}
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 min-w-0 pb-10">
        {isCompany && profile?.kind === "company" ? (
          <TabsContent value="company" className="m-0 focus-visible:outline-none focus-visible:ring-0">
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

      <TabsContent value="account" className="m-0 focus-visible:outline-none focus-visible:ring-0">
        <AccountInfoCard
          user={user}
          phone={phone}
          locale={locale}
        />
      </TabsContent>

        <TabsContent value="security" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <ChangePasswordCard />
          <TwoFactorCard />
          {passkeyEnabled ? <PasskeysCard /> : null}
        </TabsContent>

        <TabsContent value="privacy" className="m-0 space-y-6 focus-visible:outline-none focus-visible:ring-0">
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

        <TabsContent value="blocked" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <BlockedAccountsCard />
        </TabsContent>

        <TabsContent value="appeals" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <AppealsCard />
        </TabsContent>

        <TabsContent value="notifications" className="m-0 focus-visible:outline-none focus-visible:ring-0">
          <NotificationPreferencesCard />
        </TabsContent>
      </div>
    </Tabs>
  )
}
