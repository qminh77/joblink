"use client"

import { Mail, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { SessionUserSummary } from "@/features/auth/types"

import { ChangePasswordCard } from "./change-password-card"
import { LocaleCard } from "./locale-card"

const ROLE_LABELS: Record<SessionUserSummary["role"], string> = {
  member: "Thành viên",
  company: "Nhà tuyển dụng",
  admin: "Quản trị viên",
}

const STATUS_LABELS: Record<SessionUserSummary["status"], { label: string; tone: string }> = {
  active: { label: "Đang hoạt động", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  pending_verification: { label: "Chờ xác minh", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  suspended: { label: "Tạm khóa", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  banned: { label: "Bị cấm", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  deleted: { label: "Đã xóa", tone: "bg-muted text-muted-foreground" },
}

export function AccountInfoCard({
  user,
  locale,
}: {
  user: SessionUserSummary
  locale: string
}) {
  const status = STATUS_LABELS[user.status]

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-border/30 p-6 space-y-4">
        <h2 className="font-headline font-bold text-base text-foreground">
          Thông tin tài khoản
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Email đăng nhập</p>
            <p className="flex items-center gap-2 text-foreground">
              <Mail className="w-4 h-4 text-muted-foreground" /> {user.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vai trò</p>
            <p className="text-foreground">{ROLE_LABELS[user.role]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Trạng thái</p>
            <Badge className={status.tone}>
              <ShieldCheck className="w-3 h-3 mr-1" /> {status.label}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Ngôn ngữ</p>
            <p className="text-foreground uppercase">{locale}</p>
          </div>
        </div>
      </Card>

      <ChangePasswordCard />
      <LocaleCard initialLocale={locale} />
    </div>
  )
}
