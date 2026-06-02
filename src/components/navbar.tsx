"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import {
  BarChart2,
  Bell,
  Briefcase,
  Globe,
  Home,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { MessageDropdown } from "@/components/message-dropdown"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { getInitials } from "@/lib/utils/format"

const NAV_ITEMS = [
  { key: "home", href: "/home", icon: Home },
  { key: "network", href: "/network", icon: Users },
  { key: "jobs", href: "/jobs", icon: Briefcase },
  {
    key: "messages",
    href: "/messages",
    icon: MessageSquare,
    hasDropdown: "messages" as const,
  },
  {
    key: "notifications",
    href: "/notifications",
    icon: Bell,
    hasDropdown: "notifications" as const,
  },
] satisfies Array<{
  key: "home" | "network" | "jobs" | "messages" | "notifications"
  href: string
  icon: typeof Home
  hasDropdown?: "messages" | "notifications"
}>

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useCurrentUser()
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const initials = getInitials(user.displayName, "JL")
  const tNav = useTranslations("nav")
  const tPost = useTranslations("posts")
  const tProfile = useTranslations("profile.visibility")

  return (
    <>
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl gap-0 p-0">
          <DialogHeader className="p-4 border-b border-border/40">
            <DialogTitle className="font-headline font-bold text-lg text-center">
              {tPost("createTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-10 h-10">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm">{user.displayName}</h3>
                <span className="text-[11px] bg-muted px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 font-medium text-muted-foreground">
                  <Globe className="w-3 h-3" /> {tProfile("public")}
                </span>
              </div>
            </div>
            <motion.textarea
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              placeholder={tPost("whatsOnYourMind")}
              className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 resize-none text-foreground placeholder:text-muted-foreground/70"
              autoFocus
            />
          </div>
          <div className="p-4 border-t border-border/40 flex items-center justify-between">
            <div className="flex gap-2">
              <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors">
                <ImageIcon className="size-5" />
              </button>
              <button className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors">
                <BarChart2 className="size-5" />
              </button>
            </div>
            <Button
              onClick={() => setIsCreatePostOpen(false)}
              className="px-6 rounded-xl font-semibold"
            >
              {tPost("publish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <nav className="bg-background/80 backdrop-blur-xl border-b border-border/40 fixed top-0 w-full flex justify-between items-center px-4 md:px-8 h-16 z-50 transition-colors">
        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/home" className="flex items-center gap-2 group">
            <Logo size="sm" />
          </Link>

          <div className="hidden sm:flex relative items-center group">
                  <Search className="absolute left-3 text-muted-foreground size-4 group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              className="h-9 pl-9 pr-4 bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary w-48 md:w-64 lg:w-80 rounded-full transition-all text-sm"
              placeholder={tNav("searchPlaceholder")}
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 lg:gap-2">
          <div className="hidden md:flex items-center">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === "/jobs" && pathname.startsWith("/jobs/"))
              const Icon = item.icon
              const baseClasses = "flex flex-col items-center justify-center w-14 lg:w-16 h-16 transition-all duration-200 relative text-muted-foreground"

              const trigger = (
                <button className={baseClasses} type="button">
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`size-5 transition-colors duration-200 ${isActive ? "text-primary fill-primary/20" : ""}`}
                    />
                  </div>
                  <span className="font-body text-[10px] font-semibold mt-1 hidden lg:block">
                    {tNav(item.key)}
                  </span>
                </button>
              )

              if (item.hasDropdown === "notifications") {
                return (
                  <NotificationDropdown key={item.href}>
                    {trigger}
                  </NotificationDropdown>
                )
              }

              if (item.hasDropdown === "messages") {
                return <MessageDropdown key={item.href}>{trigger}</MessageDropdown>
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={baseClasses}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={`size-5 transition-colors duration-200 ${isActive ? "text-primary fill-primary/20" : ""}`}
                    />
                  </div>
                  <span className="font-body text-[10px] font-semibold mt-1 hidden lg:block">
                    {tNav(item.key)}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-primary hover:bg-primary/10 text-xs h-8 px-3"
                >
                  <Plus className="size-4 mr-0.5" />
                  {tPost("postCta")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-56 p-1.5 rounded-2xl bg-background/95 backdrop-blur-2xl"
              >
                <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  {tPost("createMenuLabel")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/20" />
                <DropdownMenuItem
                  onClick={() => setIsCreatePostOpen(true)}
                  className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-primary/5"
                >
                  <ImageIcon className="w-4 h-4 text-blue-500 mr-3 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {tPost("createPost")}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {tPost("createPostHint")}
                    </p>
                  </div>
                </DropdownMenuItem>
                {user.role === "company" ? (
                  <DropdownMenuItem
                    onClick={() => router.push("/company/post-job")}
                    className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-primary/5"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {tPost("createJob")}
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        {tPost("createJobHint")}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden sm:block h-6 w-px bg-border/40 mx-1" />

            <LanguageSwitcher />
            <ThemeToggle />

            <ProfileDropdown />
          </div>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 w-full bg-background/90 backdrop-blur-xl border-t border-border/40 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/jobs" && pathname.startsWith("/jobs/"))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full relative text-muted-foreground"
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`size-5 transition-colors duration-200 ${isActive ? "text-primary fill-primary/20" : ""}`}
                  />
                </div>
                <span className="text-[10px] font-medium mt-1">
                  {tNav(item.key)}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
