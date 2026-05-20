"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp } from "@/lib/animations"
import { useState } from "react"
import {
  Search, Filter, ScrollText, UserCheck, Shield, Settings, Clock,
  LayoutDashboard, Users, Building2, Flag,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface AuditEntry {
  id: number
  actor: string
  action: string
  target: string
  details: string
  oldData: string
  newData: string
  ip: string
  timestamp: string
}

const auditLogs: AuditEntry[] = [
  { id: 1, actor: "admin@system", action: "company.verify", target: "TechViet Innovations", details: "Xác minh doanh nghiệp thành công", oldData: "status: pending", newData: "status: verified", ip: "192.168.1.100", timestamp: "15/05/2026 09:30:00" },
  { id: 2, actor: "admin@system", action: "user.suspend", target: "user_12345", details: "Tạm khóa người dùng vì spam", oldData: "status: active", newData: "status: suspended", ip: "192.168.1.100", timestamp: "15/05/2026 08:15:00" },
  { id: 3, actor: "admin@system", action: "company.reject", target: "GreenTech Solutions", details: "Từ chối xác minh doanh nghiệp", oldData: "status: pending", newData: "status: rejected", ip: "192.168.1.101", timestamp: "14/05/2026 17:45:00" },
  { id: 4, actor: "mod@system", action: "content.hide", target: "post_45678", details: "Ẩn bài viết vi phạm", oldData: "visible: true", newData: "visible: false", ip: "192.168.1.102", timestamp: "14/05/2026 14:20:00" },
  { id: 5, actor: "admin@system", action: "user.ban", target: "user_98765", details: "Cấm người dùng vĩnh viễn", oldData: "status: active", newData: "status: banned", ip: "192.168.1.100", timestamp: "13/05/2026 11:00:00" },
  { id: 6, actor: "admin@system", action: "settings.update", target: "SMTP Config", details: "Cập nhật cấu hình SMTP", oldData: "host: smtp.old.com", newData: "host: smtp.gmail.com", ip: "192.168.1.100", timestamp: "13/05/2026 10:30:00" },
  { id: 7, actor: "mod@system", action: "report.resolve", target: "report_123", details: "Giải quyết báo cáo", oldData: "status: pending", newData: "status: resolved", ip: "192.168.1.102", timestamp: "12/05/2026 16:00:00" },
  { id: 8, actor: "admin@system", action: "user.restore", target: "user_54321", details: "Khôi phục người dùng", oldData: "status: suspended", newData: "status: active", ip: "192.168.1.100", timestamp: "12/05/2026 09:15:00" },
  { id: 9, actor: "admin@system", action: "company.verify", target: "DataCore Systems", details: "Xác minh doanh nghiệp", oldData: "status: pending", newData: "status: verified", ip: "192.168.1.101", timestamp: "11/05/2026 14:00:00" },
  { id: 10, actor: "mod@system", action: "content.hide", target: "comment_6789", details: "Ẩn bình luận xúc phạm", oldData: "visible: true", newData: "visible: false", ip: "192.168.1.102", timestamp: "11/05/2026 10:45:00" },
]

const actionTypes = ["All", "company.verify", "company.reject", "user.suspend", "user.ban", "user.restore", "content.hide", "report.resolve", "settings.update"]

const actionIcons: Record<string, React.ElementType> = {
  "company.verify": Building2,
  "company.reject": Building2,
  "user.suspend": Shield,
  "user.ban": Shield,
  "user.restore": UserCheck,
  "content.hide": ScrollText,
  "report.resolve": Flag,
  "settings.update": Settings,
}

const actionColors: Record<string, string> = {
  "company.verify": "bg-emerald-500/10 text-emerald-500",
  "company.reject": "bg-red-500/10 text-red-500",
  "user.suspend": "bg-amber-500/10 text-amber-500",
  "user.ban": "bg-red-500/10 text-red-500",
  "user.restore": "bg-blue-500/10 text-blue-500",
  "content.hide": "bg-purple-500/10 text-purple-500",
  "report.resolve": "bg-emerald-500/10 text-emerald-500",
  "settings.update": "bg-primary/10 text-primary",
}

export default function AdminAuditLogPage() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("All")

  const filtered = auditLogs.filter((entry) => {
    const matchAction = actionFilter === "All" || entry.action === actionFilter
    const matchSearch = entry.actor.toLowerCase().includes(search.toLowerCase()) ||
      entry.target.toLowerCase().includes(search.toLowerCase()) ||
      entry.details.toLowerCase().includes(search.toLowerCase())
    return matchAction && matchSearch
  })

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="flex gap-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
          {[
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
            { label: "Users", icon: Users, href: "/admin/users" },
            { label: "Companies", icon: Building2, href: "/admin/companies" },
            { label: "Reports", icon: Flag, href: "/admin/reports" },
            { label: "Audit Log", icon: ScrollText, href: "/admin/audit-log", active: true },
            { label: "Settings", icon: Settings, href: "/admin/settings" },
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
              <item.icon className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </Card>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Lịch sử hoạt động quản trị</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo actor, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-lg bg-card border-border/30 text-sm"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 rounded-lg">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{filtered.length} entries</p>
        </div>

        <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((entry) => {
            const Icon = actionIcons[entry.action] || ScrollText
            const colorClass = actionColors[entry.action] || "bg-muted text-muted-foreground"
            return (
              <motion.div key={entry.id} variants={fadeUp} className="bg-card border-border/30 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{entry.actor}</span>
                      <span className="text-muted-foreground text-sm">•</span>
                      <Badge variant="outline" className="text-xs border-border/30">{entry.action}</Badge>
                      <span className="text-muted-foreground text-sm">•</span>
                      <span className="text-sm text-foreground">{entry.target}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{entry.details}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {entry.timestamp}</span>
                      <span>IP: {entry.ip}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-[11px] bg-muted/50 px-2 py-0.5 rounded text-muted-foreground">{entry.oldData}</span>
                      <span className="text-[11px] text-muted-foreground">→</span>
                      <span className="text-[11px] bg-primary/5 px-2 py-0.5 rounded text-primary">{entry.newData}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </motion.div>
  )
}
