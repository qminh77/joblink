"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Ban,
  Bell,
  Building2,
  KeyRound,
  Menu,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import type { SessionUserSummary } from "@/features/auth/types"
import type {
  CompanyProfileDetail,
  MemberProfileDetail,
} from "@/features/profile/types"
import type { ProvinceRow } from "@/types/database"

import { AccountInfoCard } from "./account-info-card"
import { CompanyInfoCard } from "./company-info-card"
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

interface NavItem {
  value: string
  icon: React.ElementType
  label: string
}

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
  const [activeTab, setActiveTab] = useState(
    isCompany ? "company" : "account",
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems: NavItem[] = []

  if (isCompany) {
    navItems.push({
      value: "company",
      icon: Building2,
      label: t("tabs.company"),
    })
  }
  navItems.push(
    { value: "account", icon: User, label: t("tabs.account") },
    { value: "security", icon: KeyRound, label: "Bảo mật & Đăng nhập" },
    { value: "privacy", icon: Shield, label: t("tabs.privacy") },
    { value: "blocked", icon: Ban, label: t("tabs.blocked") },
    { value: "appeals", icon: ShieldAlert, label: t("tabs.appeals") },
    { value: "notifications", icon: Bell, label: t("tabs.notifications") },
  )

  function handleNavigate(value: string) {
    setActiveTab(value)
    setMobileOpen(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <nav className="sticky top-24 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.value
            return (
              <button
                key={item.value}
                onClick={() => handleNavigate(item.value)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors outline-none ${
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      <div className="flex lg:hidden items-center gap-2 pb-2 border-b border-border/30">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground outline-none">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[260px] sm:w-[300px] p-0 flex flex-col gap-0 border-r-0"
          >
            <div className="p-4 border-b border-border/30">
              <SheetTitle className="text-base font-semibold">
                {t("title")}
              </SheetTitle>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.value
                return (
                  <button
                    key={item.value}
                    onClick={() => handleNavigate(item.value)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors outline-none ${
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-medium text-foreground">
          {navItems.find((i) => i.value === activeTab)?.label}
        </span>
      </div>

      <div className="flex-1 min-w-0 pb-10">
        {isCompany && profile?.kind === "company" && activeTab === "company" ? (
          <CompanyInfoCard
            user={user}
            company={profile.data}
            provinces={provinces}
          />
        ) : null}

        {activeTab === "account" ? (
          <AccountInfoCard
            user={user}
            phone={phone}
            locale={locale}
          />
        ) : null}

        {activeTab === "security" ? (
          <div className="space-y-6">
            <ChangePasswordCard />
            <TwoFactorCard />
            {passkeyEnabled ? <PasskeysCard /> : null}
          </div>
        ) : null}

        {activeTab === "privacy" ? (
          <div className="space-y-6">
            {profile?.kind === "member" ? (
              <PrivacyCard
                initialVisibility={profile.data.profile_visibility}
                initialOpenToWork={profile.data.open_to_work}
              />
            ) : null}
            {profile?.kind === "company" ? (
              <OpenToHireCard initialValue={profile.data.open_to_hire} />
            ) : null}
          </div>
        ) : null}

        {activeTab === "blocked" ? <BlockedAccountsCard /> : null}
        {activeTab === "appeals" ? <AppealsCard /> : null}
        {activeTab === "notifications" ? <NotificationPreferencesCard /> : null}
      </div>
    </div>
  )
}
