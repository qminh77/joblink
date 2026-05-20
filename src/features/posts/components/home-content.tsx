import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Bookmark, Building2, ChevronDown, MoreHorizontal } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { SuggestionList } from "@/features/network/components/suggestion-list"
import { getInitials } from "@/lib/utils/format"

import { loadHomeFeed } from "../api/queries"

import { HomeComposerTrigger } from "./home-composer-trigger"
import { PostsFeed } from "./posts-feed"

export async function HomeContent() {
  const [tHome, tNav, user, feed] = await Promise.all([
    getTranslations("home"),
    getTranslations("nav"),
    requireCurrentUser(),
    loadHomeFeed(),
  ])

  const userInitials = getInitials(user.profile.displayName, "JL")
  const headlineFallback =
    user.appUser.role === "company"
      ? tHome("companyHeadlineFallback")
      : tHome("memberHeadlineFallback")

  const realtimeAuthorIds = [
    ...(feed.me ? [feed.me] : []),
    ...feed.connection_ids,
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        <Card className="overflow-hidden bg-card border-border/40 rounded-2xl p-0 gap-0">
          <div className="h-16 bg-gradient-to-r from-primary/80 to-blue-400" />
          <CardContent className="p-0">
            <div className="relative w-16 h-16 rounded-full border-[3px] border-card -mt-8 mx-auto overflow-hidden bg-muted">
              <Avatar className="w-full h-full">
                {user.profile.avatarUrl ? (
                  <AvatarImage src={user.profile.avatarUrl} />
                ) : null}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center mt-2 border-b border-border/40 pb-4 px-4">
              <Link
                href="/profile/me"
                className="font-headline font-bold text-foreground text-lg hover:text-primary transition-all"
              >
                {user.profile.displayName}
              </Link>
              <p className="text-sm text-muted-foreground font-body mt-0.5">
                {user.profile.headline ?? headlineFallback}
              </p>
            </div>

            <div className="py-3 space-y-3 border-b border-border/40 px-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {tHome("profileViews")}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {feed.stats.profile_view_count}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {tHome("connections")}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {feed.stats.connection_count}
                </span>
              </div>
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

        <Card className="bg-card border-border/40 rounded-2xl p-4">
          <h3 className="text-sm font-headline font-bold text-foreground mb-4">
            {tHome("connectSuggestions")}
          </h3>
          <SuggestionList suggestions={feed.suggestions} />
        </Card>
      </aside>

      <div className="col-span-1 lg:col-span-6 space-y-4">
        <HomeComposerTrigger />

        <div className="flex items-center gap-3 px-2 pt-1 pb-1">
          <Separator className="flex-grow shrink bg-border/40" />
          <span className="text-[11px] text-muted-foreground flex items-center cursor-pointer hover:text-foreground transition-colors whitespace-nowrap uppercase tracking-widest font-semibold">
            {tHome("latest")} <ChevronDown className="w-3 h-3 ml-1" />
          </span>
        </div>

        <PostsFeed
          initialPage={{ posts: feed.posts, nextCursor: feed.next_cursor }}
          contacts={feed.suggestions}
          realtimeAuthorIds={realtimeAuthorIds}
        />
      </div>

      <aside className="hidden lg:block col-span-1 lg:col-span-3 space-y-4">
        <Card className="bg-card border-border/40 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <h3 className="text-[12px] font-bold text-foreground uppercase tracking-widest">
              {tHome("jobSuggestions")}
            </h3>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/jobs/1"
              className="border border-border/40 rounded-xl p-3 hover:border-primary/40 hover:bg-muted/20 transition-all cursor-pointer group bg-card block"
            >
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border border-border/40 overflow-hidden group-hover:bg-primary/5 transition-colors">
                  <Building2 className="text-primary w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline font-bold text-foreground text-[13px] truncate group-hover:text-primary transition-colors">
                    Senior Frontend
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Global Tech Solutions
                  </p>
                </div>
              </div>
            </Link>
          </div>
          <Link href="/jobs" className="flex">
            <Button
              variant="ghost"
              className="w-full mt-3 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 rounded-lg"
            >
              Xem tất cả
            </Button>
          </Link>
        </Card>
      </aside>
    </div>
  )
}
