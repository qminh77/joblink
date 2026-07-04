"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Bell, CheckCheck, ChevronDown } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useLoadMoreNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/hooks"
import {
  getNotificationLabelParams,
  getNotificationVisual,
} from "@/features/notifications/lib/render"
import type { NotificationItem } from "@/features/notifications/types"
import { btnTap, fadeUp, pageEntrance, slideLeft, staggerSm } from "@/lib/animations"
import { getInitials } from "@/lib/utils/format"
import { useRelativeTimeFormatter } from "@/lib/utils/use-relative-time"

type FilterValue = "all" | "unread" | "connect" | "jobs"

const CONNECT_TYPES = new Set<NotificationItem["type"]>([
  "connection_request",
  "connection_accepted",
])
const JOBS_TYPES = new Set<NotificationItem["type"]>([
  "company_followed",
  "job_application_received",
  "application_status_changed",
  "application_withdrawn",
])

function filterItems(
  items: NotificationItem[],
  filter: FilterValue,
): NotificationItem[] {
  switch (filter) {
    case "unread":
      return items.filter((item) => !item.isRead)
    case "connect":
      return items.filter((item) => CONNECT_TYPES.has(item.type))
    case "jobs":
      return items.filter((item) => JOBS_TYPES.has(item.type))
    default:
      return items
  }
}

export function NotificationsPageClient({
  initialItems = [],
  initialHasMore = false,
}: {
  initialItems?: NotificationItem[]
  initialHasMore?: boolean
}) {
  const t = useTranslations("notifications")
  const tTypes = useTranslations("notifications.types")
  const tStatus = useTranslations("notifications.appStatus")
  const router = useRouter()
  const [filter, setFilter] = useState<FilterValue>("all")

  const { data: notifications = [] } = useNotifications(
    initialItems.length > 0 ? initialItems : undefined,
  )
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const loadMore = useLoadMoreNotifications()
  const formatRel = useRelativeTimeFormatter()

  const unreadCount = notifications.filter((item) => !item.isRead).length
  const visible = filterItems(notifications, filter)

  const lastItem = notifications.at(-1)
  const hasMore =
    initialHasMore ||
    (notifications.length > initialItems.length &&
      lastItem != null &&
      loadMore.data?.hasMore !== false)

  const handleLoadMore = useCallback(() => {
    const cursor = notifications.at(-1)?.createdAt
    if (cursor) loadMore.mutate(cursor)
  }, [notifications, loadMore])

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
            {notifications.length > 0
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
          <TabsTrigger
            value="jobs"
            className="rounded-lg text-sm px-3 whitespace-nowrap"
          >
            {t("filters.jobs")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
            {visible.length === 0 ? (
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
              <>
                <motion.ul
                  variants={staggerSm}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-border/30"
                >
                  {visible.map((item) => {
                    const visual = getNotificationVisual(item)
                    const Icon = visual.icon
                    const labelParams = getNotificationLabelParams(item, (s) =>
                      tStatus(s),
                    )
                    const sentence = (
                      <>
                        {visual.actorName ? (
                          <span className="font-semibold text-foreground">
                            {visual.actorName}
                          </span>
                        ) : null}{" "}
                        {tTypes(item.type, labelParams)}
                      </>
                    )

                    return (
                      <motion.li key={item.id} variants={slideLeft}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!item.isRead) markRead.mutate(item.id)
                            router.push(visual.href)
                          }}
                          className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/30 w-full text-left ${
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
                            <p className="text-sm text-foreground/90">
                              {sentence}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {formatRel(item.createdAt)}
                              </span>
                              {!item.isRead ? (
                                <span className="w-2 h-2 rounded-full bg-primary" />
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </motion.li>
                    )
                  })}
                </motion.ul>

                {hasMore ? (
                  <div className="p-3 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadMore.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      <ChevronDown className="w-4 h-4" />
                      {loadMore.isPending ? "..." : "Tải thêm"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
