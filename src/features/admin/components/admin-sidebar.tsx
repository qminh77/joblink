"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Briefcase,
  Building2,
  ChevronDown,
  Database,
  FileText,
  Flag,
  Gavel,
  HelpCircle,
  LayoutDashboard,
  Palette,
  ScrollText,
  Settings,
  Tags,
  Users,
  Shield,
  Menu,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

const GROUPS = [
  {
    key: "overview",
    items: [{ key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard, requiredPermission: "dashboard.view" }],
  },
  {
    key: "management",
    items: [
      { key: "users", href: "/admin/users", icon: Users, requiredPermission: "users.view" },
      { key: "companies", href: "/admin/companies", icon: Building2, requiredPermission: "companies.view" },
      { key: "jobs", href: "/admin/jobs", icon: Briefcase, requiredPermission: "jobs.view" },
      { key: "posts", href: "/admin/posts", icon: FileText, requiredPermission: "posts.view" },
    ],
  },
  {
    key: "moderation",
    items: [
      { key: "reports", href: "/admin/reports", icon: Flag, requiredPermission: "reports.view" },
      { key: "appeals", href: "/admin/appeals", icon: Gavel, requiredPermission: "appeals.view" },
      { key: "auditLog", href: "/admin/audit-log", icon: ScrollText, requiredPermission: "audit.view" },
      { key: "contactSubmissions", href: "/admin/contact-submissions", icon: HelpCircle, requiredPermission: "contacts.view" },
    ],
  },
  {
    key: "system",
    items: [
      { key: "roles", href: "/admin/roles", icon: Shield, requiredPermission: "roles.view" },
      { key: "brand", href: "/admin/brand", icon: Palette, requiredPermission: "brand.view" },
      { key: "reportTypes", href: "/admin/report-types", icon: Tags, requiredPermission: "report_types.view" },
      { key: "lookups", href: "/admin/lookups", icon: Database, requiredPermission: "lookups.view" },
      { key: "settings", href: "/admin/settings", icon: Settings, requiredPermission: "settings.view" },
    ],
  },
] as const

export function AdminSidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname()
  const t = useTranslations("admin.nav")

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0">
      <div className="sticky top-24 space-y-4">
        <NavContent pathname={pathname} t={t} permissions={permissions} />
      </div>
    </aside>
  )
}

export function AdminMobileNav({ permissions }: { permissions: string[] }) {
  const pathname = usePathname()
  const t = useTranslations("admin.nav")
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 flex flex-col gap-0 border-r-0">
        <div className="p-4 border-b border-border/30">
          <SheetTitle className="text-lg font-bold">Admin Panel</SheetTitle>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <NavContent pathname={pathname} t={t} onNavigate={() => setOpen(false)} permissions={permissions} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NavContent({
  pathname,
  t,
  onNavigate,
  permissions,
}: {
  pathname: string
  t: (key: string) => string
  onNavigate?: () => void
  permissions: string[]
}) {
  return (
    <>
      {GROUPS.map((group) => (
        <SidebarGroup
          key={group.key}
          group={group}
          pathname={pathname}
          t={t}
          onNavigate={onNavigate}
          permissions={permissions}
        />
      ))}
    </>
  )
}

const SETTINGS_SUBITEMS = [
  { key: "regional", tab: "regional" },
  { key: "smtp", tab: "smtp" },
  { key: "recaptcha", tab: "recaptcha" },
  { key: "security", tab: "security" },
  { key: "contact", tab: "contact" },
  { key: "maintenance", tab: "maintenance" },
] as const

const LOOKUPS_SUBITEMS = [
  { key: "provinces", kind: "provinces" },
  { key: "wards", kind: "wards" },
  { key: "job_types", kind: "job_types" },
  { key: "work_modes", kind: "work_modes" },
  { key: "job_positions", kind: "job_positions" },
  { key: "report_types", kind: "report_types" },
  { key: "skills", kind: "skills" },
] as const

function SidebarItem({
  item,
  pathname,
  t,
  onNavigate,
}: {
  item: (typeof GROUPS)[number]["items"][number]
  pathname: string
  t: (key: string) => string
  onNavigate?: () => void
}) {
  const tSettings = useTranslations("admin.settings.groups")
  const tLookups = useTranslations("admin.lookups.tabs")
  const searchParams = useSearchParams()
  const isSettingsActive = pathname === "/admin/settings"
  const isLookupsActive = pathname === "/admin/lookups"
  const currentTab = searchParams.get("tab") || "site_identity"
  const currentKind = searchParams.get("kind") || "provinces"
  const [settingsSubOpen, setSettingsSubOpen] = useState(isSettingsActive)
  const [lookupsSubOpen, setLookupsSubOpen] = useState(isLookupsActive)

  if (item.key === "settings") {
    const Icon = item.icon
    return (
      <div className="space-y-1">
        <button
          onClick={() => setSettingsSubOpen(!settingsSubOpen)}
          className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isSettingsActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span>{t(item.key)}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              settingsSubOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {settingsSubOpen && (
          <div className="pl-6 space-y-0.5 border-l border-border/30 ml-5">
            {SETTINGS_SUBITEMS.map((sub) => {
              const isActive = isSettingsActive && currentTab === sub.tab
              return (
                <Link
                  key={sub.tab}
                  href={`/admin/settings?tab=${sub.tab}`}
                  onClick={onNavigate}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  {tSettings(sub.key)}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (item.key === "lookups") {
    const Icon = item.icon
    return (
      <div className="space-y-1">
        <button
          onClick={() => setLookupsSubOpen(!lookupsSubOpen)}
          className={`flex w-full items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
            isLookupsActive
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span>{t(item.key)}</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              lookupsSubOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {lookupsSubOpen && (
          <div className="pl-6 space-y-0.5 border-l border-border/30 ml-5">
            {LOOKUPS_SUBITEMS.map((sub) => {
              const isActive = isLookupsActive && currentKind === sub.kind
              return (
                <Link
                  key={sub.kind}
                  href={`/admin/lookups?kind=${sub.kind}`}
                  onClick={onNavigate}
                  className={`flex items-center px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  {tLookups(sub.key)}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const Icon = item.icon
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      }`}
    >
      <Icon className="w-5 h-5" />
      {t(item.key)}
    </Link>
  )
}

function SidebarGroup({
  group,
  pathname,
  t,
  onNavigate,
  permissions,
}: {
  group: (typeof GROUPS)[number]
  pathname: string
  t: (key: string) => string
  onNavigate?: () => void
  permissions: string[]
}) {
  const visibleItems = group.items.filter(
    (item) => !item.requiredPermission || permissions.includes(item.requiredPermission),
  )

  const hasActive = visibleItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  const [isOpen, setIsOpen] = useState(hasActive || group.key === "overview")

  if (visibleItems.length === 0) return null

  const isSingleItem = visibleItems.length === 1 && group.key === "overview"

  if (isSingleItem) {
    return (
      <SidebarItem
        item={visibleItems[0]}
        pathname={pathname}
        t={t}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
      >
        <span>{t(`groups.${group.key}`)}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="space-y-0.5">
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              pathname={pathname}
              t={t}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
