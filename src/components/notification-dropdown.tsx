"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Bell,
  ThumbsUp,
  MessageCircle,
  UserPlus,
  CheckCheck,
  ChevronRight,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const recentNotifications = [
  {
    id: 1,
    type: "like",
    user: "Trần Hoàng",
    initials: "TH",
    content: "đã thích bài viết của bạn",
    time: "5 phút trước",
    icon: ThumbsUp,
    color: "text-muted-foreground",
  },
  {
    id: 2,
    type: "comment",
    user: "Lê Vy",
    initials: "LV",
    content: "đã bình luận: \"Khóa học tuyệt vời quá!\"",
    time: "15 phút trước",
    icon: MessageCircle,
    color: "text-muted-foreground",
  },
  {
    id: 3,
    type: "connect",
    user: "Phạm Minh",
    initials: "PM",
    content: "đã gửi lời mời kết nối",
    time: "30 phút trước",
    icon: UserPlus,
    color: "text-muted-foreground",
  },
]

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const fadeIn = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export function NotificationDropdown({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-80 p-0 rounded-2xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/30">
          <div>
            <h3 className="font-headline font-bold text-sm text-foreground">Thông báo</h3>
            <p className="text-[11px] text-muted-foreground">3 thông báo chưa đọc</p>
          </div>
          <Link
            href="/notifications"
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Đã đọc
          </Link>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <motion.div variants={stagger} initial="hidden" animate="show">
            {recentNotifications.map((notif, index) => {
              const Icon = notif.icon
              return (
                <motion.div key={notif.id} variants={fadeIn}>
                  <Link
                    href="/notifications"
                    className={`flex items-start gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${
                      index < recentNotifications.length - 1 ? "border-b border-border/10" : ""
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${notif.color} mt-0.5 shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        <span className="font-semibold text-foreground">{notif.user} </span>
                        {notif.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        <Link
          href="/notifications"
          className="flex items-center justify-center gap-1 px-4 py-3.5 text-xs font-semibold text-primary hover:bg-muted/30 transition-colors border-t border-border/20 rounded-b-2xl group"
        >
          Xem tất cả thông báo
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
