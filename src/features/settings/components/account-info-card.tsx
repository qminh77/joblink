"use client"

import { useTranslations } from "next-intl"
import { Mail, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { SessionUserSummary } from "@/features/auth/types"

import { ChangePasswordCard } from "./change-password-card"
import { LocaleCard } from "./locale-card"

const STATUS_TONES: Record<SessionUserSummary["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  pending_verification: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
  deleted: "bg-muted text-muted-foreground",
}

export function AccountInfoCard({
  user,
  locale,
}: {
  user: SessionUserSummary
  locale: string
}) {
  const t = useTranslations("settings.account")
  const tRoles = useTranslations("settings.roles")
  const tStatus = useTranslations("settings.statuses")

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-4">
        <h2 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("email")}</p>
            <p className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" /> {user.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("role")}</p>
            <p className="text-foreground">{tRoles(user.role)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("status")}</p>
            <Badge variant="outline" className={`border-0 ${STATUS_TONES[user.status]}`}>
              <ShieldCheck className="w-3 h-3 mr-1" /> {tStatus(user.status)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t("locale")}</p>
            <p className="text-foreground uppercase">{locale}</p>
          </div>
        </div>
      </Card>

      <ChangePasswordCard />
      <LocaleCard initialLocale={locale} />
    </div>
  )
}
