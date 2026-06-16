"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Briefcase,
  Building2,
  Database,
  FileText,
  Flag,
  Gavel,
  LayoutDashboard,
  ScrollText,
  Settings,
  Tags,
  Users,
} from "lucide-react"

import { Card } from "@/components/ui/card"

const ITEMS = [
  { key: "dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { key: "users", href: "/admin/users", icon: Users },
  { key: "companies", href: "/admin/companies", icon: Building2 },
  { key: "jobs", href: "/admin/jobs", icon: Briefcase },
  { key: "posts", href: "/admin/posts", icon: FileText },
  { key: "reportTypes", href: "/admin/report-types", icon: Tags },
  { key: "reports", href: "/admin/reports", icon: Flag },
  { key: "appeals", href: "/admin/appeals", icon: Gavel },
  { key: "auditLog", href: "/admin/audit-log", icon: ScrollText },
  { key: "lookups", href: "/admin/lookups", icon: Database },
  { key: "settings", href: "/admin/settings", icon: Settings },
] as const

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations("admin.nav")

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0">
      <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(item.key)}
            </Link>
          )
        })}
      </Card>
    </aside>
  )
}
