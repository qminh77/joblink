"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldX,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { CompanyVerification } from "@/types/database"

import { useResubmitVerification } from "../hooks"

const VISUAL: Record<
  CompanyVerification,
  { icon: LucideIcon; tone: string }
> = {
  pending: { icon: Clock, tone: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  pending_update: {
    icon: AlertTriangle,
    tone: "text-amber-600 bg-amber-500/10 border-amber-500/30",
  },
  verified: {
    icon: BadgeCheck,
    tone: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
  },
  rejected: { icon: ShieldX, tone: "text-destructive bg-destructive/10 border-destructive/30" },
  suspended: {
    icon: ShieldAlert,
    tone: "text-destructive bg-destructive/10 border-destructive/30",
  },
}

const RESUBMITTABLE = new Set<CompanyVerification>(["rejected", "pending_update"])

export function CompanyVerificationCard({
  status,
  note,
}: {
  status: CompanyVerification
  note: string | null
}) {
  const t = useTranslations("companies.verification")
  const router = useRouter()
  const resubmit = useResubmitVerification()

  const visual = VISUAL[status]
  const Icon = visual.icon
  const canResubmit = RESUBMITTABLE.has(status)

  return (
    <Card className={`rounded-2xl border p-4 mb-5 ${visual.tone}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm">{t(`status.${status}`)}</p>
          <p className="text-xs opacity-90 mt-0.5">{t(`hint.${status}`)}</p>
          {note && (status === "rejected" || status === "pending_update") ? (
            <div className="mt-2 rounded-lg bg-background/60 p-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                {t("reasonLabel")}
              </p>
              <p className="text-sm mt-0.5 whitespace-pre-line">{note}</p>
            </div>
          ) : null}
          {canResubmit ? (
            <Button
              size="sm"
              className="rounded-lg mt-3 h-8"
              disabled={resubmit.isPending}
              onClick={() =>
                resubmit.mutate(undefined, {
                  onSuccess: (r) => {
                    if (r.ok) router.refresh()
                  },
                })
              }
            >
              {resubmit.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              )}
              {t("resubmit")}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
