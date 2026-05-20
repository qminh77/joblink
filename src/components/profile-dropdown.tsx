"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Bookmark,
  Eye,
  HelpCircle,
  Settings,
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

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

export function ProfileDropdown() {
  const router = useRouter()
  const user = useCurrentUser()
  const initials = getInitials(user.displayName, "JL")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="block outline-none group">
          <Avatar className="w-8 h-8 border-2 border-border/60 cursor-pointer hover:border-primary/60 transition-all duration-300">
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
        className="w-72 p-0 rounded-2xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
      >
        <div className="relative">
          <div className="h-16 bg-gradient-to-r from-primary/15 to-primary/5" />
          <div className="px-4 pb-3 -mt-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border-2 border-background overflow-hidden shrink-0 bg-muted shadow-sm">
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
            <Link
              href="/profile/me"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem hồ sơ</span>
            </Link>
            <Link
              href="/network"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Mạng lưới</span>
            </Link>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2 bg-border/30" />

        <div className="p-1.5">
          <DropdownMenuGroup>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.05 }}
            >
              <DropdownMenuItem
                onClick={() => router.push("/profile/me")}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <User className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    Xem trang cá nhân
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Hồ sơ chuyên nghiệp của bạn
                  </p>
                </div>
              </DropdownMenuItem>
            </motion.div>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.08 }}
            >
              <DropdownMenuItem
                onClick={() => router.push("/saved-jobs")}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <Bookmark className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    Việc làm đã lưu
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Danh sách việc làm bạn theo dõi
                  </p>
                </div>
              </DropdownMenuItem>
            </motion.div>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1 bg-border/20" />

          <DropdownMenuGroup>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.11 }}
            >
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <Settings className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    Cài đặt tài khoản
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Bảo mật, thông báo, quyền riêng tư
                  </p>
                </div>
              </DropdownMenuItem>
            </motion.div>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.14 }}
            >
              <DropdownMenuItem className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted">
                <HelpCircle className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">
                    Trợ giúp &amp; Hỗ trợ
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Liên hệ, câu hỏi thường gặp
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
