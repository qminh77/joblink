"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp, slideLeft, btnTap } from "@/lib/animations"
import {
  Briefcase, Users, Eye, TrendingUp, Plus,
  Search, Filter, MoreHorizontal, Clock,
  CheckCircle, XCircle, MessageCircle, Calendar,
  ChevronDown, Building2, MapPin, DollarSign,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const stats = [
  { label: "Việc làm đang tuyển", value: "12", icon: Briefcase, change: "+2", positive: true },
  { label: "Đơn ứng tuyển", value: "156", icon: Users, change: "+28", positive: true },
  { label: "Lượt xem job", value: "2.4K", icon: Eye, change: "+12%", positive: true },
  { label: "Tỉ lệ chấp nhận", value: "68%", icon: TrendingUp, change: "+5%", positive: true },
]

const mockJobs = [
  { id: 1, title: "Senior UX/UI Designer", applicants: 24, views: 340, status: "active", created: "12/05/2026" },
  { id: 2, title: "Frontend Developer (React)", applicants: 18, views: 280, status: "active", created: "10/05/2026" },
  { id: 3, title: "Product Manager", applicants: 31, views: 420, status: "active", created: "08/05/2026" },
  { id: 4, title: "Backend Engineer (Node.js)", applicants: 12, views: 190, status: "draft", created: "15/05/2026" },
  { id: 5, title: "DevOps Engineer", applicants: 8, views: 150, status: "closed", created: "01/03/2026" },
]

const mockApplicants = [
  { id: 1, name: "Nguyễn Văn An", initials: "NA", title: "UX Designer", job: "Senior UX/UI Designer", status: "reviewed", applied: "2 ngày trước" },
  { id: 2, name: "Lê Phương Thảo", initials: "LT", title: "Frontend Dev", job: "Frontend Developer (React)", status: "interview", applied: "3 ngày trước" },
  { id: 3, name: "Trần Hoàng", initials: "TH", title: "Product Owner", job: "Product Manager", status: "applied", applied: "1 ngày trước" },
  { id: 4, name: "Phạm Minh", initials: "PM", title: "Fullstack Dev", job: "Backend Engineer (Node.js)", status: "offered", applied: "5 ngày trước" },
  { id: 5, name: "Hoàng Yến", initials: "HY", title: "DevOps", job: "DevOps Engineer", status: "hired", applied: "1 tuần trước" },
]

const statusColors: Record<string, string> = {
  active: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
  draft: "text-muted-foreground bg-muted",
  closed: "text-red-600 bg-red-50 dark:bg-red-500/10",
  applied: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
  reviewed: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
  interview: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
  offered: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
  hired: "text-green-600 bg-green-50 dark:bg-green-500/10",
}

export default function CompanyDashboardPage() {
  const [tab, setTab] = useState("overview")

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-foreground">Company Dashboard</h1>
          <p className="text-sm text-muted-foreground">TechViet Innovations • Quản lý tuyển dụng và ứng viên</p>
        </div>
        <Link href="/company/post-job">
          <motion.span {...btnTap}>
            <Button className="rounded-lg">
              <Plus className="w-4 h-4 mr-1.5" />
              Đăng tin tuyển dụng
            </Button>
          </motion.span>
        </Link>
      </div>

      {/* Stats */}
      <motion.div variants={staggerSm} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} variants={fadeUp}>
            <Card className="bg-card border-border/30 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <h3 className="font-headline font-bold text-2xl text-foreground mt-1">{s.value}</h3>
                <span className={`text-xs font-semibold ${s.positive ? "text-emerald-600" : "text-red-500"}`}>{s.change} so với tháng trước</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-sm px-4">Tổng quan</TabsTrigger>
          <TabsTrigger value="jobs" className="rounded-lg text-sm px-4">Việc làm</TabsTrigger>
          <TabsTrigger value="applicants" className="rounded-lg text-sm px-4">Ứng viên</TabsTrigger>
          <TabsTrigger value="pipeline" className="rounded-lg text-sm px-4">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="bg-card border-border/30 rounded-xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-4">Việc làm gần đây</h2>
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
              {mockJobs.slice(0, 3).map(job => (
                <motion.div key={job.id} variants={slideLeft} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate block">{job.title}</Link>
                      <p className="text-xs text-muted-foreground">{job.applicants} ứng viên • {job.views} lượt xem</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[job.status]}`}>{job.status}</span>
                </motion.div>
              ))}
            </motion.div>
          </Card>

          <Card className="bg-card border-border/30 rounded-xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-4">Ứng viên mới nhất</h2>
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
              {mockApplicants.slice(0, 3).map(app => (
                <motion.div key={app.id} variants={slideLeft} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-9 h-9"><AvatarFallback className="text-xs">{app.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.title} • {app.job}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[app.status]}`}>{app.status}</span>
                </motion.div>
              ))}
            </motion.div>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 h-9 rounded-full bg-muted border-none text-sm" placeholder="Tìm việc làm..." />
            </div>
            <motion.span {...btnTap}>
              <Button variant="outline" size="sm" className="rounded-full h-9"><Filter className="w-4 h-4 mr-1" /> Lọc</Button>
            </motion.span>
          </div>
          <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="divide-y divide-border/30">
              {mockJobs.map(job => (
                <motion.div key={job.id} variants={slideLeft} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Briefcase className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/jobs/${job.id}`} className="font-semibold text-sm text-foreground hover:text-primary hover:underline truncate block">{job.title}</Link>
                      <p className="text-xs text-muted-foreground">{job.applicants} ứng viên • {job.views} lượt xem • {job.created}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[job.status]}`}>{job.status}</span>
                    <button className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Card>
        </TabsContent>

        <TabsContent value="applicants" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 h-9 rounded-full bg-muted border-none text-sm" placeholder="Tìm ứng viên..." />
            </div>
            <motion.span {...btnTap}>
              <Button variant="outline" size="sm" className="rounded-full h-9"><Filter className="w-4 h-4 mr-1" /> Lọc</Button>
            </motion.span>
          </div>
          <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="divide-y divide-border/30">
              {mockApplicants.map(app => (
                <motion.div key={app.id} variants={slideLeft} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="w-10 h-10"><AvatarFallback>{app.initials}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.title} • {app.job}</p>
                      <p className="text-[11px] text-muted-foreground">Nộp {app.applied}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusColors[app.status]}`}>{app.status}</span>
                    <motion.span {...btnTap}>
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" /> Liên hệ
                      </Button>
                    </motion.span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-5 gap-3">
            {["Applied", "Reviewed", "Interview", "Offered", "Hired"].map((stage, i) => (
              <Card key={stage} className="bg-card border-border/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-foreground">{stage}</h3>
                  <span className="text-xs text-muted-foreground">{mockApplicants.filter(a => a.status === stage.toLowerCase()).length}</span>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {mockApplicants.filter(a => a.status === stage.toLowerCase()).map(app => (
                    <div key={app.id} className="p-2.5 rounded-lg bg-muted/50 border border-border/30 text-xs">
                      <p className="font-semibold text-foreground truncate">{app.name}</p>
                      <p className="text-muted-foreground truncate">{app.job}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
