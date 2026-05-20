"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp, slideLeft, btnTap } from "@/lib/animations"
import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, Users, Building2, Flag, ScrollText, Settings, TrendingUp, Activity,
  ChevronRight, Search, MoreHorizontal,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard", active: true },
  { label: "Users", icon: Users, href: "/admin/users", active: false },
  { label: "Companies", icon: Building2, href: "/admin/companies", active: false },
  { label: "Reports", icon: Flag, href: "/admin/reports", active: false },
  { label: "Audit Log", icon: ScrollText, href: "/admin/audit-log", active: false },
  { label: "Settings", icon: Settings, href: "/admin/settings", active: false },
]

const kpiCards = [
  { label: "DAU", value: "12,450", change: "+8%", icon: Activity, color: "text-blue-500 bg-blue-500/10" },
  { label: "MAU", value: "124,800", change: "+12%", icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/10" },
  { label: "Jobs Active", value: "3,240", change: "+5%", icon: Building2, color: "text-purple-500 bg-purple-500/10" },
  { label: "Applications", value: "18,920", change: "+23%", icon: Users, color: "text-orange-500 bg-orange-500/10" },
  { label: "Pending Reports", value: "17", change: "-3", icon: Flag, color: "text-red-500 bg-red-500/10" },
]

const recentSignups = [
  { name: "Nguyễn Văn An", email: "an.nguyen@email.com", role: "Member", joined: "2 phút trước", initials: "NA" },
  { name: "Lê Phương Thảo", email: "thao.le@email.com", role: "Company", joined: "15 phút trước", initials: "LT" },
  { name: "Trần Hoàng Minh", email: "minh.tran@email.com", role: "Member", joined: "1 giờ trước", initials: "TM" },
  { name: "Phạm Thị Yến", email: "yen.pham@email.com", role: "Company", joined: "3 giờ trước", initials: "PY" },
  { name: "Hoàng Văn Tú", email: "tu.hoang@email.com", role: "Member", joined: "5 giờ trước", initials: "HT" },
]

const pendingReports = [
  { id: 1, type: "User", reason: "Spam", reporter: "Nguyễn Văn A", date: "2 giờ trước" },
  { id: 2, type: "Job", reason: "Nội dung sai", reporter: "Lê Thị B", date: "4 giờ trước" },
  { id: 3, type: "Company", reason: "Thông tin giả mạo", reporter: "Trần Văn C", date: "6 giờ trước" },
]

function BarChart() {
  const data = [
    { label: "T2", value: 65 }, { label: "T3", value: 80 }, { label: "T4", value: 45 },
    { label: "T5", value: 90 }, { label: "T6", value: 70 }, { label: "T7", value: 55 },
    { label: "CN", value: 40 },
  ]
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="flex items-end justify-between gap-2 h-32 pt-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full bg-primary/20 rounded-t-md transition-all hover:bg-primary/40"
            style={{ height: `${(d.value / max) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="flex gap-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
          {sidebarItems.map((item) => (
            <Link
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
            </Link>
          ))}
        </Card>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Tổng quan hệ thống</p>
        </div>

        <motion.div variants={staggerSm} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpiCards.map((kpi) => (
            <motion.div key={kpi.label} variants={fadeUp} className="bg-card border-border/30 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <div className={`w-8 h-8 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
              </div>
              <motion.p variants={fadeUp} className="text-xl font-bold text-foreground">{kpi.value}</motion.p>
              <span className={`text-xs font-semibold ${kpi.change.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}>
                {kpi.change} so với tuần trước
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={staggerSm} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} className="bg-card border-border/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">User Growth (7 ngày)</h2>
              <Badge variant="outline" className="border-border/30 text-xs">+23%</Badge>
            </div>
            <BarChart />
          </motion.div>

          <motion.div variants={fadeUp} className="bg-card border-border/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground">Recent Signups</h2>
              <Link href="/admin/users" className="text-xs text-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
              {recentSignups.map((user) => (
                <motion.div key={user.email} variants={slideLeft} className="flex items-center gap-3">
                  <Avatar className="w-8 h-8"><AvatarImage src="https://emmariani.github.io/cartoon-hero/img/mode.jpg" /><AvatarFallback className="text-xs">{user.initials}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="border-border/30 text-xs">{user.role}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{user.joined}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card border-border/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">Pending Reports</h2>
            <Link href="/admin/reports" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <motion.div variants={staggerSm} initial="hidden" animate="show" className="divide-y divide-border/20">
            {pendingReports.map((report) => (
              <motion.div key={report.id} variants={slideLeft} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Flag className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{report.type}</span> - {report.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">Bởi {report.reporter} • {report.date}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-xs">Pending</Badge>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
