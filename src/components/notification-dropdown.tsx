"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Bell, CheckCheck, ChevronRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks"
import { getNotificationVisual } from "@/features/notifications/lib/render"
import { cn } from "@/lib/utils"
import { formatRelativeTime, getInitials } from "@/lib/utils/format"

const DROPDOWN_LIMIT = 6

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const fadeIn = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export function NotificationDropdown({
  className,
}: {
  className?: string
}) {
  const t = useTranslations("notifications")
  const tTypes = useTranslations("notifications.types")
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter((item) => !item.isRead).length
  const visible = notifications.slice(0, DROPDOWN_LIMIT)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className={cn("rounded-full h-9 px-3 relative", className)}
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 shrink-0" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none pointer-events-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 p-0 rounded-2xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
          <div>
            <h3 className="font-headline font-bold text-sm text-foreground">
              {t("title")}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {unreadCount > 0
                ? t("dropdown.unreadSummary", { count: unreadCount })
                : t("noUnread")}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5 disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {t("dropdown.markRead")}
            </button>
          ) : null}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              {t("dropdown.empty")}
            </p>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show">
              {visible.map((item, index) => {
                const visual = getNotificationVisual(item)
                const Icon = visual.icon
                return (
                  <motion.div key={item.id} variants={fadeIn}>
                    <Link
                      href={visual.href}
                      onClick={() => {
                        if (!item.isRead) markRead.mutate(item.id)
                      }}
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${
                        index < visible.length - 1
                          ? "border-b border-border/10"
                          : ""
                      } ${!item.isRead ? "bg-primary/[0.03]" : ""}`}
                    >
                      {visual.actorUserId != null ? (
                        <Avatar className="w-8 h-8 shrink-0 border border-border/30">
                          {visual.actorAvatarUrl ? (
                            <AvatarImage src={visual.actorAvatarUrl} />
                          ) : null}
                          <AvatarFallback className="text-[10px]">
                            {getInitials(visual.actorName ?? "JL", "JL")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div
                          className={`w-8 h-8 rounded-full ${visual.iconClassName} flex items-center justify-center shrink-0`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/90 leading-relaxed">
                          {visual.actorName ? (
                            <span className="font-semibold text-foreground">
                              {visual.actorName}{" "}
                            </span>
                          ) : null}
                          {tTypes(item.type)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(item.createdAt)}
                          </span>
                          {!item.isRead ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>

        <Link
          href="/notifications"
          className="flex items-center justify-center gap-1 px-4 py-3.5 text-xs font-semibold text-primary hover:bg-muted/30 transition-colors border-t border-border/20 rounded-b-2xl group"
        >
          {t("dropdown.viewAll")}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
