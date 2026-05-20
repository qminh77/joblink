"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { ChevronRight, PenSquare } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const recentConversations = [
  {
    id: 1,
    name: "Trần Hoàng",
    initials: "TH",
    message: "Chắc chắn rồi, tôi sẽ gửi bạn thông tin chi tiết.",
    time: "2 phút trước",
    online: true,
    unread: 2,
  },
  {
    id: 2,
    name: "Lê Vy",
    initials: "LV",
    message: "Cảm ơn bạn, tôi sẽ xem xét!",
    time: "1 giờ trước",
    online: false,
    unread: 0,
  },
  {
    id: 3,
    name: "Phạm Minh",
    initials: "PM",
    message: "Đã nhận được file rồi, cảm ơn bạn!",
    time: "30 phút trước",
    online: true,
    unread: 0,
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

export function MessageDropdown({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations("messages")
  const unreadCount = recentConversations.filter((c) => c.unread > 0).length

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
            <h3 className="font-headline font-bold text-sm text-foreground">{t("title")}</h3>
            <p className="text-[11px] text-muted-foreground">{t("dropdown.unreadSummary", { count: unreadCount })}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary"
          >
            <PenSquare className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <motion.div variants={stagger} initial="hidden" animate="show">
            {recentConversations.map((conv, index) => (
              <motion.div key={conv.id} variants={fadeIn}>
                <Link
                  href="/messages"
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${
                    index < recentConversations.length - 1 ? "border-b border-border/10" : ""
                  } ${conv.unread > 0 ? "bg-primary/[0.02]" : ""}`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10 rounded-xl">

                      <AvatarFallback className="text-xs font-semibold">
                        {conv.initials}
                      </AvatarFallback>
                    </Avatar>
                    {conv.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-sm truncate ${
                          conv.unread > 0
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground"
                        }`}
                      >
                        {conv.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {conv.time}
                      </span>
                    </div>
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        conv.unread > 0
                          ? "text-foreground/80 font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {conv.message}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                      {conv.unread}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <Link
          href="/messages"
          className="flex items-center justify-center gap-1 px-4 py-3.5 text-xs font-semibold text-primary hover:bg-muted/30 transition-colors border-t border-border/20 rounded-b-2xl group"
        >
          {t("dropdown.viewAll")}
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
