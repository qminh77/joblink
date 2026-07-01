"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  Bookmark,
  Eye,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { LogoutMenuItem } from "@/features/auth/components/logout-menu-item"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export function ProfileDropdown() {
  const router = useRouter()
  const user = useCurrentUser()
  const selfHref = profileHref(user.id, user.role)
  const initials = getInitials(user.displayName, "JL")
  const tNav = useTranslations("nav")
  const tMenu = useTranslations("profileMenu")
  const isMember = user.role === "member"
  const isCompany = user.role === "company"
  const canViewProfile = user.role !== "admin"
  const canViewSavedJobs = isMember
  const canViewApplications = isMember
  const canManageCompanyJobs = isCompany
  const adminHref = user.adminHref ?? "/admin"
  const warmupHrefs = useMemo(() => {
    const hrefs = [
      canViewProfile ? selfHref : null,
      user.role !== "admin" ? "/network" : null,
      canViewSavedJobs ? "/saved-jobs" : null,
      canViewApplications ? "/jobs/applications" : null,
      canManageCompanyJobs ? "/company/post-job" : null,
      user.adminHref ? adminHref : null,
      "/settings",
    ]
    return Array.from(new Set(hrefs.filter(Boolean))) as string[]
  }, [
    adminHref,
    canManageCompanyJobs,
    canViewApplications,
    canViewProfile,
    canViewSavedJobs,
    selfHref,
    user.adminHref,
    user.role,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      for (const href of warmupHrefs) router.prefetch(href)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [router, warmupHrefs])

  function pushWarm(href: string) {
    router.prefetch(href)
    router.push(href)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="block outline-none group">
          <Avatar className="w-8 h-8 cursor-pointer transition-all duration-300">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
            <AvatarFallback className="text-xs font-semibold text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-72 p-0 rounded-2xl bg-background/95 backdrop-blur-2xl overflow-hidden"
      >
        <div className="relative">
          {user.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.coverUrl}
              alt=""
              className="h-16 w-full object-cover bg-muted"
            />
          ) : (
            <div className="h-16 bg-gradient-to-r from-primary/15 to-primary/5" />
          )}
          <div className="px-4 pb-3 -mt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                <Avatar className="w-full h-full rounded-xl">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="text-sm font-semibold text-foreground bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <p className="font-semibold text-sm text-foreground truncate">
                  {user.displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 px-4 pb-3">
            {canViewProfile ? (
              <Link
                href={selfHref}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{tMenu("viewProfileShort")}</span>
              </Link>
            ) : null}
            {user.role !== "admin" ? (
              <Link
                href="/network"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{tNav("network")}</span>
              </Link>
            ) : null}
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2 bg-border/30" />

        <div className="p-1.5">
          <DropdownMenuGroup>
            {canViewProfile ? (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.05 }}
            >
              <DropdownMenuItem
                onPointerEnter={() => router.prefetch(selfHref)}
                onFocus={() => router.prefetch(selfHref)}
                onClick={() => pushWarm(selfHref)}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <User className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {tMenu("viewProfile")}
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {tMenu("viewProfileHint")}
                  </p>
                </div>
              </DropdownMenuItem>
            </motion.div>
            ) : null}
            {canViewSavedJobs ? (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.08 }}
              >
                <DropdownMenuItem
                  onPointerEnter={() => router.prefetch("/saved-jobs")}
                  onFocus={() => router.prefetch("/saved-jobs")}
                  onClick={() => pushWarm("/saved-jobs")}
                  className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                >
                  <Bookmark className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {tNav("savedJobs")}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tMenu("savedJobsHint")}
                    </p>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            ) : null}
            {canViewApplications ? (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.09 }}
              >
                <DropdownMenuItem
                  onPointerEnter={() => router.prefetch("/jobs/applications")}
                  onFocus={() => router.prefetch("/jobs/applications")}
                  onClick={() => pushWarm("/jobs/applications")}
                  className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                >
                  <FileText className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {tMenu("myApplications")}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tMenu("myApplicationsHint")}
                    </p>
                  </div>
                </DropdownMenuItem>
              </motion.div>
            ) : null}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1 bg-border/20" />

          {canManageCompanyJobs ? (
            <DropdownMenuGroup>
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.1 }}
              >
                <DropdownMenuItem
                  onPointerEnter={() => router.prefetch("/company/post-job")}
                  onFocus={() => router.prefetch("/company/post-job")}
                  onClick={() => pushWarm("/company/post-job")}
                  className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                >
                  <LayoutDashboard className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {tMenu("manageJobs")}
                    </span>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tMenu("manageJobsHint")}
                    </p>
                  </div>
                </DropdownMenuItem>
              </motion.div>
              <DropdownMenuSeparator className="my-1 bg-border/20" />
            </DropdownMenuGroup>
          ) : null}

          {user.adminHref ? (
            <DropdownMenuGroup>
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
                transition={{ delay: 0.1 }}
              >
                <DropdownMenuItem
                  onPointerEnter={() => router.prefetch(adminHref)}
                  onFocus={() => router.prefetch(adminHref)}
                  onClick={() => pushWarm(adminHref)}
                  className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                >
                  <Shield className="w-4 h-4 text-primary mr-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {tNav("admin")}
                    </span>
                  </div>
                </DropdownMenuItem>
              </motion.div>
              <DropdownMenuSeparator className="my-1 bg-border/20" />
            </DropdownMenuGroup>
          ) : null}

          <DropdownMenuGroup>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.11 }}
            >
              <DropdownMenuItem
                onPointerEnter={() => router.prefetch("/settings")}
                onFocus={() => router.prefetch("/settings")}
                onClick={() => pushWarm("/settings")}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <Settings className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    {tMenu("settings")}
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {tMenu("settingsHint")}
                  </p>
                </div>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1 bg-border/20" />

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.17 }}
          >
            <LogoutMenuItem />
          </motion.div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
