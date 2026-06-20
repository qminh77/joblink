"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { CompanyVerification } from "@/types/database"

export function CompanyTabs({
  children,
  counts,
  onTabChange,
  tab,
}: {
  children: ReactNode
  counts: Record<CompanyVerification | "all", number>
  onTabChange: (value: string) => void
  tab: string
}) {
  const t = useTranslations("admin.companies")

  return (
    <Tabs value={tab} onValueChange={onTabChange}>
      <TabsList className="bg-muted/60 p-1 rounded-xl flex-wrap">
        <TabsTrigger value="pending" className="rounded-lg text-sm px-3">
          {t("tabs.pending", { count: counts.pending ?? 0 })}
        </TabsTrigger>
        <TabsTrigger value="verified" className="rounded-lg text-sm px-3">
          {t("tabs.verified", { count: counts.verified ?? 0 })}
        </TabsTrigger>
        <TabsTrigger value="rejected" className="rounded-lg text-sm px-3">
          {t("tabs.rejected", { count: counts.rejected ?? 0 })}
        </TabsTrigger>
        <TabsTrigger value="suspended" className="rounded-lg text-sm px-3">
          {t("tabs.suspended", { count: counts.suspended ?? 0 })}
        </TabsTrigger>
        <TabsTrigger value="all" className="rounded-lg text-sm px-3">
          {t("tabs.all", { count: counts.all ?? 0 })}
        </TabsTrigger>
      </TabsList>

      <TabsContent value={tab} className="mt-4 space-y-3">
        {children}
      </TabsContent>
    </Tabs>
  )
}
