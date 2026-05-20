"use client"

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Bell, CheckCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks"
import { getNotificationVisual } from "@/features/notifications/lib/render"
import type { NotificationItem } from "@/features/notifications/types"
import { btnTap, fadeUp, pageEntrance, slideLeft, staggerSm } from "@/lib/animations"
import { formatRelativeTime, getInitials } from "@/lib/utils/format"

type FilterValue = "all" | "unread" | "connect"

const CONNECT_TYPES = new Set(["connection_request", "connection_accepted"])

function filterItems(
  items: NotificationItem[],
  filter: FilterValue,
): NotificationItem[] {
  switch (filter) {
    case "unread":
      return items.filter((item) => !item.isRead)
    case "connect":
      return items.filter((item) => CONNECT_TYPES.has(item.type))
    default:
      return items
  }
}

export default function NotificationsPage() {
  const t = useTranslations("notifications")
  const tTypes = useTranslations("notifications.types")
  const [filter, setFilter] = useState<FilterValue>("all")

  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const unreadCount = notifications.filter((item) => !item.isRead).length
  const visible = filterItems(notifications, filter)

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-4"
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-headline font-bold text-2xl text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? t("unreadSummary", { count: unreadCount })
              : t("noUnread")}
          </p>
        </div>
        {unreadCount > 0 ? (
          <motion.button
            {...btnTap}
            type="button"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors disabled:opacity-50 text-primary h-8 px-3 hover:bg-muted"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            {t("markAllRead")}
          </motion.button>
        ) : null}
      </motion.div>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as FilterValue)}
      >
        <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto">
          <TabsTrigger
            value="all"
            className="rounded-lg text-sm px-3 whitespace-nowrap"
          >
            {t("tabs.all")}
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="rounded-lg text-sm px-3 whitespace-nowrap"
          >
            {t("tabs.unread")}
            {unreadCount > 0 ? ` (${unreadCount})` : ""}
          </TabsTrigger>
          <TabsTrigger
            value="connect"
            className="rounded-lg text-sm px-3 whitespace-nowrap"
          >
            {t("tabs.connect")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <Card className="bg-card border-border/40 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                …
              </div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-headline font-bold text-lg text-foreground">
                  {t("empty.title")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("empty.desc")}
                </p>
              </div>
            ) : (
              <motion.ul
                variants={staggerSm}
                initial="hidden"
                animate="show"
                className="divide-y divide-border/30"
              >
                {visible.map((item) => {
                  const visual = getNotificationVisual(item)
                  const Icon = visual.icon
                  const sentence = (
                    <>
                      {visual.actorName ? (
                        <span className="font-semibold text-foreground">
                          {visual.actorName}
                        </span>
                      ) : null}{" "}
                      {tTypes(item.type)}
                    </>
                  )

                  return (
                    <motion.li key={item.id} variants={slideLeft}>
                      <Link
                        href={visual.href}
                        onClick={() => {
                          if (!item.isRead) markRead.mutate(item.id)
                        }}
                        className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/30 ${
                          !item.isRead ? "bg-primary/[0.03]" : ""
                        }`}
                      >
                        {visual.actorUserId != null ? (
                          <Avatar className="w-10 h-10 shrink-0 border border-border/30">
                            {visual.actorAvatarUrl ? (
                              <AvatarImage src={visual.actorAvatarUrl} />
                            ) : null}
                            <AvatarFallback>
                              {getInitials(visual.actorName ?? "JL", "JL")}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div
                            className={`w-10 h-10 rounded-full ${visual.iconClassName} flex items-center justify-center shrink-0`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground/90">{sentence}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                            {!item.isRead ? (
                              <span className="w-2 h-2 rounded-full bg-primary" />
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </motion.li>
                  )
                })}
              </motion.ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
