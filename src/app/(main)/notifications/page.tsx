"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, slideLeft, fadeUp, btnTap } from "@/lib/animations"
import { useState } from "react"
import Link from "next/link"
import {
  ThumbsUp, MessageCircle, UserPlus, Share2,
  Briefcase, Bell, CheckCheck, MoreHorizontal,
  Calendar, Award, Bookmark,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Notification {
  id: number
  type: "like" | "comment" | "connect" | "share" | "job" | "event" | "achievement" | "bookmark"
  user: string
  initials: string
  content: string
  time: string
  read: boolean
}

const allNotifications: Notification[] = [
  { id: 1, type: "like", user: "Trần Hoàng", initials: "TH", content: "đã thích bài viết của bạn", time: "5 phút trước", read: false },
  { id: 2, type: "comment", user: "Lê Vy", initials: "LV", content: "đã bình luận: \"Khóa học tuyệt vời quá!\"", time: "15 phút trước", read: false },
  { id: 3, type: "connect", user: "Phạm Minh", initials: "PM", content: "đã gửi lời mời kết nối", time: "30 phút trước", read: false },
  { id: 4, type: "share", user: "Hoàng Yến", initials: "HY", content: "đã chia sẻ bài viết của bạn", time: "1 giờ trước", read: false },
  { id: 5, type: "like", user: "Đỗ Văn", initials: "ĐV", content: "và 5 người khác đã thích bài viết của bạn", time: "2 giờ trước", read: true },
  { id: 6, type: "comment", user: "Minh Anh", initials: "MA", content: "đã trả lời bình luận của bạn", time: "3 giờ trước", read: true },
  { id: 7, type: "job", user: "", initials: "", content: "Senior Frontend Developer phù hợp với bạn", time: "5 giờ trước", read: true },
  { id: 8, type: "event", user: "", initials: "", content: "Sự kiện: \"UX Design Summit 2026\" sắp diễn ra", time: "1 ngày trước", read: true },
  { id: 9, type: "achievement", user: "", initials: "", content: "Chúc mừng! Bạn đã đạt được huy hiệu \"Top Creator\"", time: "2 ngày trước", read: true },
  { id: 10, type: "bookmark", user: "", initials: "", content: "Việc làm \"Product Designer\" đã được lưu", time: "3 ngày trước", read: true },
  { id: 11, type: "connect", user: "Thanh Thảo", initials: "TT", content: "đã chấp nhận lời mời kết nối", time: "4 ngày trước", read: true },
  { id: 12, type: "like", user: "Quốc Bình", initials: "QB", content: "đã thích bài viết của bạn", time: "5 ngày trước", read: true },
]

const iconMap = {
  like: ThumbsUp,
  comment: MessageCircle,
  connect: UserPlus,
  share: Share2,
  job: Briefcase,
  event: Calendar,
  achievement: Award,
  bookmark: Bookmark,
}

const colorMap = {
  like: "text-blue-500 bg-blue-500/10",
  comment: "text-emerald-500 bg-emerald-500/10",
  connect: "text-purple-500 bg-purple-500/10",
  share: "text-orange-500 bg-orange-500/10",
  job: "text-primary bg-primary/10",
  event: "text-pink-500 bg-pink-500/10",
  achievement: "text-yellow-500 bg-yellow-500/10",
  bookmark: "text-teal-500 bg-teal-500/10",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(allNotifications)
  const [activeTab, setActiveTab] = useState("all")

  const filteredNotifications = activeTab === "all"
    ? notifications
    : activeTab === "unread"
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === activeTab)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-between">
        <div>
          <h1 className="font-headline font-bold text-2xl text-foreground">Thông báo</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
          </p>
        </div>
        {unreadCount > 0 && (
          <motion.button {...btnTap} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-primary h-8 px-3 hover:bg-muted" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Đánh dấu đã đọc
          </motion.button>
        )}
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto">
          <TabsTrigger value="all" className="rounded-lg text-sm px-3 whitespace-nowrap">
            Tất cả
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg text-sm px-3 whitespace-nowrap">
            Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="like" className="rounded-lg text-sm px-3 whitespace-nowrap">Thích</TabsTrigger>
          <TabsTrigger value="comment" className="rounded-lg text-sm px-3 whitespace-nowrap">Bình luận</TabsTrigger>
          <TabsTrigger value="connect" className="rounded-lg text-sm px-3 whitespace-nowrap">Kết nối</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="bg-card border-border/40 rounded-2xl overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-headline font-bold text-lg text-foreground">Không có thông báo</h3>
                <p className="text-sm text-muted-foreground mt-1">Bạn sẽ nhận được thông báo khi có hoạt động mới.</p>
              </div>
            ) : (
              <motion.div variants={staggerSm} initial="hidden" animate="show" className="divide-y divide-border/30">
                {filteredNotifications.map((notif) => {
                  const Icon = iconMap[notif.type]
                  return (
                    <motion.div variants={slideLeft}
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-muted/30 ${!notif.read ? "bg-primary/[0.02]" : ""}`}
                    >
                    {notif.user ? (
                      <Link href={`/profile/${notif.id}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarImage src="https://emmariani.github.io/cartoon-hero/img/mode.jpg" />
                          <AvatarFallback>{notif.initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${colorMap[notif.type]} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90">
                        {notif.user && (
                          <Link href={`/profile/${notif.id}`} className="font-semibold text-foreground hover:text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                            {notif.user}
                          </Link>
                        )}{" "}
                        {notif.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{notif.time}</span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                        )}
                      </div>
                    </div>
                    <button className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    </motion.div>
                  )
                })}
                </motion.div>
              )
            }
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
