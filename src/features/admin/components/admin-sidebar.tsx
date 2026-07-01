"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Briefcase,
  Building2,
  ChevronDown,
  FileText,
  Flag,
  LayoutDashboard,
  ScrollText,
  Users,
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
    items: [{ key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    key: "management",
    items: [
      { key: "users", href: "/admin/users", icon: Users },
      { key: "companies", href: "/admin/companies", icon: Building2 },
      { key: "jobs", href: "/admin/jobs", icon: Briefcase },
      { key: "posts", href: "/admin/posts", icon: FileText },
    ],
  },
  {
    key: "moderation",
    items: [
      { key: "reports", href: "/admin/reports", icon: Flag },
      { key: "auditLog", href: "/admin/audit-log", icon: ScrollText },
    ],
  },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations("admin.nav")

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0">
      <div className="sticky top-24 space-y-4">
        <NavContent pathname={pathname} t={t} />
      </div>
    </aside>
  )
}

export function AdminMobileNav() {
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
          <NavContent pathname={pathname} t={t} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NavContent({
  pathname,
  t,
  onNavigate,
}: {
  pathname: string
  t: (key: string) => string
  onNavigate?: () => void
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
        />
      ))}
    </>
  )
}

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
}: {
  group: (typeof GROUPS)[number]
  pathname: string
  t: (key: string) => string
  onNavigate?: () => void
}) {
  const hasActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )
  const [isOpen, setIsOpen] = useState(hasActive || group.key === "overview")

  const isSingleItem = group.items.length === 1 && group.key === "overview"

  if (isSingleItem) {
    return (
      <SidebarItem
        item={group.items[0]}
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
          {group.items.map((item) => (
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
