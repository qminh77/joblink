"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Bookmark } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { formatCompactNumber, getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import { useHomeStats, useRealtimeHomeStats } from "../hooks"
import type { HomeFeedStats } from "../types"

type Props = {
  initialStats: HomeFeedStats
  displayName: string
  avatarUrl: string | null
  coverUrl: string | null
  headline: string | null
}

export function HomeStatsCard({
  initialStats,
  displayName,
  avatarUrl,
  coverUrl,
  headline,
}: Props) {
  const tHome = useTranslations("home")
  const tNav = useTranslations("nav")
  const user = useCurrentUser()

  const { data } = useHomeStats(initialStats)
  useRealtimeHomeStats(user.id)

  const stats = data ?? initialStats
  const selfHref = profileHref(user.id, user.role)
  const initials = getInitials(displayName, "JL")
  const headlineFallback =
    user.role === "company"
      ? tHome("companyHeadlineFallback")
      : tHome("memberHeadlineFallback")

  return (
    <Card className="overflow-hidden bg-card border-border/40 rounded-2xl p-0 gap-0">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt=""
          className="h-16 w-full object-cover bg-muted"
        />
      ) : (
        <div className="h-16 bg-gradient-to-r from-primary/80 to-blue-400" />
      )}
      <CardContent className="p-0">
        <div className="relative w-16 h-16 rounded-full border-[3px] border-card -mt-8 mx-auto overflow-hidden bg-muted">
          <Avatar className="w-full h-full">
            {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="text-center mt-2 border-b border-border/40 pb-4 px-4">
          <Link
            href={selfHref}
            className="font-headline font-bold text-foreground text-lg hover:text-primary transition-all"
          >
            {displayName}
          </Link>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            {headline ?? headlineFallback}
          </p>
        </div>

        <div className="py-3 space-y-3 border-b border-border/40 px-4">
          <StatRow
            label={tHome("profileViews")}
            value={stats.profile_view_count}
            href={selfHref}
          />
          <StatRow
            label={tHome("connections")}
            value={stats.connection_count}
            href="/network"
          />
        </div>

        <div className="p-3">
          <Link
            href="/saved-jobs"
            className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted/50"
          >
            <Bookmark className="w-4 h-4 mr-2" /> {tNav("savedJobs")}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function StatRow({
  label,
  value,
  href,
}: {
  label: string
  value: number
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex justify-between items-center -mx-1 px-1 py-0.5 rounded-md hover:bg-muted/40 transition-colors"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className="text-xs font-semibold text-primary tabular-nums"
        title={value.toLocaleString("vi-VN")}
      >
        {formatCompactNumber(value)}
      </span>
    </Link>
  )
}
