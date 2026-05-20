"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp } from "@/lib/animations"
import { useState } from "react"
import {
  Building2, Check, X, Search, FileCheck,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Company {
  id: number
  name: string
  taxId: string
  representative: string
  submitted: string
  status: "pending" | "verified" | "rejected"
}

const allCompanies: Company[] = [
  { id: 1, name: "TechViet Innovations", taxId: "0123456789", representative: "Nguyễn Văn An", submitted: "15/05/2026", status: "pending" },
  { id: 2, name: "FinServe Global", taxId: "9876543210", representative: "Lê Thị Thảo", submitted: "14/05/2026", status: "pending" },
  { id: 3, name: "DataCore Systems", taxId: "1122334455", representative: "Trần Minh Hoàng", submitted: "10/05/2026", status: "verified" },
  { id: 4, name: "Creative Minds Agency", taxId: "5566778899", representative: "Phạm Yến Nhi", submitted: "08/05/2026", status: "verified" },
  { id: 5, name: "GreenTech Solutions", taxId: "9988776655", representative: "Hoàng Văn Tú", submitted: "05/05/2026", status: "rejected" },
  { id: 6, name: "AlphaSoft Corp", taxId: "4433221100", representative: "Đặng Minh Tuấn", submitted: "01/05/2026", status: "pending" },
]

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("pending")
  const [companies, setCompanies] = useState<Company[]>(allCompanies)

  const filtered = companies.filter((c) => {
    const matchTab = tab === "all" || c.status === tab
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.representative.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const approve = (id: number) => {
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, status: "verified" as const } : c))
  }

  const reject = (id: number) => {
    setCompanies((prev) => prev.map((c) => c.id === id ? { ...c, status: "rejected" as const } : c))
  }

  const tabCounts = {
    pending: companies.filter((c) => c.status === "pending").length,
    verified: companies.filter((c) => c.status === "verified").length,
    rejected: companies.filter((c) => c.status === "rejected").length,
    all: companies.length,
  }

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="flex gap-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
          {[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Users", href: "/admin/users" },
            { label: "Companies", href: "/admin/companies", active: true },
            { label: "Reports", href: "/admin/reports" },
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
              <Building2 className="w-4 h-4" />
              {item.label}
            </a>
          ))}
        </Card>
      </aside>

      <div className="flex-1 min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Verification</h1>
          <p className="text-sm text-muted-foreground">Xét duyệt đăng ký doanh nghiệp</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm công ty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-lg bg-card border-border/30 text-sm"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg text-sm px-4">
              Pending ({tabCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="verified" className="rounded-lg text-sm px-4">
              Verified ({tabCounts.verified})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="rounded-lg text-sm px-4">
              Rejected ({tabCounts.rejected})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg text-sm px-4">
              All ({tabCounts.all})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
            {filtered.length === 0 && (
              <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium">No companies found</p>
                <p className="text-sm text-muted-foreground">Không có công ty nào trong mục này</p>
              </Card>
            )}
            {filtered.map((company) => (
              <motion.div key={company.id} variants={fadeUp} className="bg-card border-border/30 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <Avatar className="w-12 h-12 rounded-xl">
                      <AvatarFallback className="rounded-xl bg-primary/10">
                        <Building2 className="w-6 h-6 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{company.name}</h3>
                        {company.status === "verified" && (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1">
                            <FileCheck className="w-3 h-3" /> Verified
                          </Badge>
                        )}
                        {company.status === "rejected" && (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 text-xs">
                            Rejected
                          </Badge>
                        )}
                        {company.status === "pending" && (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                        <span>MST: {company.taxId}</span>
                        <span>Đại diện: {company.representative}</span>
                        <span>Nộp: {company.submitted}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {company.status === "pending" && (
                      <>
                        <Button size="sm" className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => approve(company.id)}>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg border-red-500/30 text-red-500 hover:bg-red-500/10"
                          onClick={() => reject(company.id)}>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  )
}
