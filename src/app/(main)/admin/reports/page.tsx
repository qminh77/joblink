"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp } from "@/lib/animations"
import { useState } from "react"
import {
  Flag, Eye, EyeOff, Shield, MoreHorizontal, AlertTriangle,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type ReportStatus = "pending" | "in-review" | "resolved" | "dismissed"
type ReportTarget = "User" | "Post" | "Comment" | "Job" | "Company"

interface Report {
  id: number
  reporter: string
  targetType: ReportTarget
  targetLabel: string
  reason: string
  description: string
  date: string
  status: ReportStatus
}

const mockReports: Report[] = [
  { id: 1, reporter: "Nguyễn Văn An", targetType: "User", targetLabel: "user_12345", reason: "Spam", description: "Người dùng này đăng spam liên tục trong các bài viết.", date: "2 giờ trước", status: "pending" },
  { id: 2, reporter: "Lê Thị Thảo", targetType: "Job", targetLabel: "Senior Dev", reason: "Nội dung sai", description: "Mô tả công việc không đúng với thực tế, lương không như quảng cáo.", date: "4 giờ trước", status: "pending" },
  { id: 3, reporter: "Trần Minh Hoàng", targetType: "Company", targetLabel: "GreenTech", reason: "Thông tin giả mạo", description: "Công ty này khai báo thông tin không chính xác về quy mô.", date: "6 giờ trước", status: "in-review" },
  { id: 4, reporter: "Phạm Thị Yến", targetType: "Comment", targetLabel: "comment_6789", reason: "Ngôn từ xúc phạm", description: "Bình luận chứa ngôn từ thô tục và xúc phạm người khác.", date: "1 ngày trước", status: "resolved" },
  { id: 5, reporter: "Hoàng Văn Tú", targetType: "Post", targetLabel: "post_45678", reason: "Nội dung nhạy cảm", description: "Bài đăng chứa nội dung không phù hợp với cộng đồng.", date: "2 ngày trước", status: "dismissed" },
  { id: 6, reporter: "Đặng Minh Tuấn", targetType: "User", targetLabel: "user_98765", reason: "Giả mạo danh tính", description: "Người dùng này sử dụng hình ảnh và thông tin giả.", date: "3 ngày trước", status: "pending" },
]

const targetTypes = ["All", "User", "Post", "Comment", "Job", "Company"]
const statusFilters = ["All", "Pending", "In Review", "Resolved", "Dismissed"]

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  "in-review": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  dismissed: "bg-muted text-muted-foreground border-border/30",
}

export default function AdminReportsPage() {
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = mockReports.filter((r) => {
    const matchType = typeFilter === "All" || r.targetType === typeFilter
    const statusKey = statusFilter === "All" ? "All" : statusFilter.toLowerCase().replace(" ", "-")
    const matchStatus = statusFilter === "All" || r.status === statusKey
    return matchType && matchStatus
  })

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="flex gap-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
          {[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Users", href: "/admin/users" },
            { label: "Companies", href: "/admin/companies" },
            { label: "Reports", href: "/admin/reports", active: true },
            { label: "Audit Log", href: "/admin/audit-log" },
            { label: "Settings", href: "/admin/settings" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Flag className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </Card>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Report Queue</h1>
          <p className="text-sm text-muted-foreground">Quản lý báo cáo từ người dùng</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 rounded-lg">
              <Flag className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targetTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-lg">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{filtered.length} reports</p>
        </div>

        <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((report) => (
            <motion.div key={report.id} variants={fadeUp} className="bg-card border-border/30 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    report.status === "resolved" ? "bg-emerald-500/10" :
                    report.status === "dismissed" ? "bg-muted" : "bg-red-500/10"
                  }`}>
                    <Flag className={`w-5 h-5 ${
                      report.status === "resolved" ? "text-emerald-500" :
                      report.status === "dismissed" ? "text-muted-foreground" : "text-red-500"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm">{report.targetType}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-foreground">{report.reason}</span>
                      <Badge variant="outline" className={`text-xs ${statusStyles[report.status]}`}>
                        {report.status === "in-review" ? "In Review" : report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mt-1">{report.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>Báo cáo bởi <span className="font-medium text-foreground">{report.reporter}</span></span>
                      <span>•</span>
                      <span>{report.date}</span>
                      <span>•</span>
                      <span className="text-muted-foreground">Target: {report.targetLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10">
                    <EyeOff className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10">
                    <Shield className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
