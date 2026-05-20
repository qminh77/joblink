"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp } from "@/lib/animations"
import { useState } from "react"
import {
  Search, Filter, Shield, ShieldOff, RotateCcw, MoreHorizontal,
  LayoutDashboard, Users, Building2, Flag, ScrollText, Settings,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

type UserRole = "Member" | "Company" | "Admin"
type UserStatus = "active" | "suspended" | "banned"

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  joined: string
  initials: string
}

const mockUsers: User[] = [
  { id: 1, name: "Nguyễn Văn An", email: "an.nguyen@email.com", role: "Member", status: "active", joined: "15/03/2026", initials: "NA" },
  { id: 2, name: "Lê Phương Thảo", email: "thao.le@email.com", role: "Company", status: "active", joined: "20/03/2026", initials: "LT" },
  { id: 3, name: "Trần Hoàng Minh", email: "minh.tran@email.com", role: "Admin", status: "active", joined: "01/01/2026", initials: "TM" },
  { id: 4, name: "Phạm Thị Yến", email: "yen.pham@email.com", role: "Company", status: "suspended", joined: "10/02/2026", initials: "PY" },
  { id: 5, name: "Hoàng Văn Tú", email: "tu.hoang@email.com", role: "Member", status: "banned", joined: "05/12/2025", initials: "HT" },
  { id: 6, name: "Đặng Minh Tuấn", email: "tuan.dang@email.com", role: "Member", status: "active", joined: "08/04/2026", initials: "ĐT" },
  { id: 7, name: "Võ Thị Hồng", email: "hong.vo@email.com", role: "Company", status: "active", joined: "22/01/2026", initials: "VH" },
  { id: 8, name: "Bùi Quốc Anh", email: "anh.bui@email.com", role: "Member", status: "suspended", joined: "14/11/2025", initials: "BA" },
  { id: 9, name: "Đỗ Lan Hương", email: "huong.do@email.com", role: "Admin", status: "active", joined: "15/06/2025", initials: "ĐH" },
  { id: 10, name: "Mai Thanh Hà", email: "ha.mai@email.com", role: "Member", status: "active", joined: "30/03/2026", initials: "MH" },
]

const roleFilters = ["All", "Member", "Company", "Admin"]

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  suspended: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  banned: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("All")
  const [users, setUsers] = useState<User[]>(mockUsers)

  const updateStatus = (id: number, newStatus: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u)))
  }

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "All" || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="flex gap-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
          {[
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
            { label: "Users", icon: Users, href: "/admin/users", active: true },
            { label: "Companies", icon: Building2, href: "/admin/companies" },
            { label: "Reports", icon: Flag, href: "/admin/reports" },
            { label: "Audit Log", icon: ScrollText, href: "/admin/audit-log" },
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
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Quản lý người dùng hệ thống</p>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-lg bg-card border-border/30 text-sm"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-36 rounded-lg">
              <Filter className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleFilters.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">{filtered.length} users</p>
        </motion.div>

        <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Joined</th>
                  <th className="text-right px-4 py-3 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <motion.tbody variants={staggerSm} initial="hidden" animate="show" className="divide-y divide-border/20">
                {filtered.map((user) => (
                  <motion.tr key={user.id} variants={fadeUp} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8"><AvatarFallback className="text-xs">{user.initials}</AvatarFallback></Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-border/30 text-xs">{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${statusStyles[user.status]}`}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{user.joined}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.status !== "banned" && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            onClick={() => updateStatus(user.id, "banned")}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        )}
                        {user.status !== "suspended" && user.status !== "banned" && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                            onClick={() => updateStatus(user.id, "suspended")}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        )}
                        {(user.status === "suspended" || user.status === "banned") && (
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() => updateStatus(user.id, "active")}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
