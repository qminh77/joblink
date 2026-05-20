"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Briefcase, Bookmark, MapPin, DollarSign,
  Clock, Building2, Search, MoreHorizontal,
  BookmarkX, ExternalLink, FileText, Eye,
  CheckCircle2, XCircle, Clock as ClockIcon,
  ChevronRight, AlertCircle,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface SavedJob {
  id: number
  title: string
  company: string
  location: string
  salary: string
  type: string
  savedAt: string
  logo: string
}

interface Application {
  id: number
  jobTitle: string
  company: string
  logo: string
  appliedAt: string
  status: "applied" | "reviewed" | "interview" | "offered" | "hired" | "rejected" | "withdrawn"
  statusNote?: string
}

const savedJobs: SavedJob[] = [
  { id: 1, title: "Senior UX/UI Designer", company: "TechViet Innovations", location: "Hồ Chí Minh", salary: "$2,000 - $3,500", type: "Full-time", savedAt: "2 ngày trước", logo: "TV" },
  { id: 2, title: "Product Manager", company: "VNG Corporation", location: "Hồ Chí Minh", salary: "$2,500 - $4,000", type: "Full-time", savedAt: "5 ngày trước", logo: "VC" },
  { id: 3, title: "Frontend Developer (React)", company: "FPT Software", location: "Đà Nẵng", salary: "$1,500 - $2,500", type: "Full-time", savedAt: "1 tuần trước", logo: "FS" },
  { id: 4, title: "DevOps Engineer", company: "VNPT Technology", location: "Hà Nội", salary: "$2,000 - $3,000", type: "Full-time", savedAt: "1 tuần trước", logo: "VT" },
  { id: 5, title: "UX Writer (Part-time)", company: "StartupX", location: "Remote", salary: "$800 - $1,200", type: "Part-time", savedAt: "2 tuần trước", logo: "SX" },
]

const applications: Application[] = [
  { id: 1, jobTitle: "Senior UX/UI Designer", company: "TechViet Innovations", logo: "TV", appliedAt: "3 ngày trước", status: "reviewed", statusNote: "Hồ sơ của bạn đang được xem xét" },
  { id: 2, jobTitle: "Product Manager", company: "VNG Corporation", logo: "VC", appliedAt: "1 tuần trước", status: "interview", statusNote: "Phỏng vấn lúc 14:00, 25/05/2026" },
  { id: 3, jobTitle: "Frontend Developer", company: "FPT Software", logo: "FS", appliedAt: "2 tuần trước", status: "applied", statusNote: "Đã gửi đơn thành công" },
  { id: 4, jobTitle: "Data Analyst", company: "Shopee", logo: "SP", appliedAt: "3 tuần trước", status: "rejected", statusNote: "Không phù hợp với yêu cầu" },
  { id: 5, jobTitle: "Backend Developer", company: "TechStartup", logo: "TS", appliedAt: "1 tháng trước", status: "offered", statusNote: "Chờ bạn xác nhận offer" },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  applied: { label: "Đã ứng tuyển", color: "text-blue-600", bg: "bg-blue-500/10", icon: FileText },
  reviewed: { label: "Đang xem xét", color: "text-amber-600", bg: "bg-amber-500/10", icon: Eye },
  interview: { label: "Phỏng vấn", color: "text-purple-600", bg: "bg-purple-500/10", icon: ClockIcon },
  offered: { label: "Đã offer", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  hired: { label: "Đã nhận việc", color: "text-emerald-700", bg: "bg-emerald-500/15", icon: CheckCircle2 },
  rejected: { label: "Không phù hợp", color: "text-red-600", bg: "bg-red-500/10", icon: XCircle },
  withdrawn: { label: "Đã rút", color: "text-gray-500", bg: "bg-gray-500/10", icon: XCircle },
}

const pipelineSteps = ["applied", "reviewed", "interview", "offered", "hired"] as const

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 15 } },
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState(savedJobs)
  const [apps, setApps] = useState(applications)
  const [searchQuery, setSearchQuery] = useState("")
  const [tab, setTab] = useState("saved")

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const removeJob = (id: number) => setJobs(prev => prev.filter(j => j.id !== id))

  const withdrawApp = (id: number) => setApps(prev => prev.map(a => a.id === id ? { ...a, status: "withdrawn" as const } : a))

  const getStepIndex = (status: string) => {
    const idx = pipelineSteps.indexOf(status as typeof pipelineSteps[number])
    return idx >= 0 ? idx : -1
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground">Việc làm & Ứng tuyển</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Theo dõi việc làm đã lưu và trạng thái ứng tuyển</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto">
          <TabsTrigger value="saved" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
            <Bookmark className="w-4 h-4 mr-1.5" /> Đã lưu ({jobs.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
            <FileText className="w-4 h-4 mr-1.5" /> Đã ứng tuyển ({apps.length})
          </TabsTrigger>
        </TabsList>

        {/* Saved Jobs */}
        <TabsContent value="saved" className="mt-5 focus-visible:outline-none">
          <div className="relative w-full sm:w-72 mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-9 rounded-xl bg-muted/50 border-border/30 text-sm" placeholder="Tìm trong việc đã lưu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {filteredJobs.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="bg-card border-border/30 rounded-xl p-10 text-center">
                <Bookmark className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-headline font-bold text-base text-foreground">{searchQuery ? "Không tìm thấy" : "Chưa có việc làm nào"}</h3>
                <p className="text-sm text-muted-foreground mt-1">{searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Lưu việc làm để theo dõi và ứng tuyển sau"}</p>
                {!searchQuery && (
                  <Link href="/jobs"><Button className="mt-4 rounded-lg text-sm"><Briefcase className="w-4 h-4 mr-1.5" /> Tìm việc ngay</Button></Link>
                )}
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {filteredJobs.map((job) => (
                <motion.div key={job.id} variants={fadeUp}>
                  <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/30 transition-all group">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0">

                        <AvatarFallback className="rounded-xl text-xs sm:text-sm font-semibold text-primary">{job.logo}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/jobs/${job.id}`} className="font-headline font-bold text-foreground text-sm sm:text-base hover:text-primary transition-colors">{job.title}</Link>
                            <p className="text-xs sm:text-sm text-muted-foreground">{job.company}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => removeJob(job.id)}>
                              <BookmarkX className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-muted-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                          <Badge variant="outline" className="border-border/30 text-[10px] font-medium px-2 py-0">{job.type}</Badge>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Lưu {job.savedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-end gap-2">
                      <Link href={`/jobs/${job.id}`}><Button variant="outline" size="sm" className="h-8 rounded-lg text-xs"><ExternalLink className="w-3.5 h-3.5 mr-1" /> Chi tiết</Button></Link>
                      <Link href={`/jobs/${job.id}`}><Button size="sm" className="h-8 rounded-lg text-xs">Ứng tuyển</Button></Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications" className="mt-5 focus-visible:outline-none">
          {apps.length === 0 ? (
            <Card className="bg-card border-border/30 rounded-xl p-10 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-headline font-bold text-base text-foreground">Chưa ứng tuyển</h3>
              <p className="text-sm text-muted-foreground mt-1">Bạn chưa ứng tuyển vị trí nào. Hãy tìm việc và apply ngay!</p>
              <Link href="/jobs"><Button className="mt-4 rounded-lg text-sm"><Briefcase className="w-4 h-4 mr-1.5" /> Tìm việc ngay</Button></Link>
            </Card>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
              {apps.map((app) => {
                const cfg = statusConfig[app.status]
                const StepIcon = cfg.icon
                const stepIdx = getStepIndex(app.status)

                return (
                  <motion.div key={app.id} variants={fadeUp}>
                    <Card className="bg-card border-border/30 rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0">

                          <AvatarFallback className="rounded-xl text-xs sm:text-sm font-semibold text-primary">{app.logo}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link href={`/jobs/${app.id}`} className="font-headline font-bold text-foreground text-sm sm:text-base hover:text-primary transition-colors">{app.jobTitle}</Link>
                              <p className="text-xs sm:text-sm text-muted-foreground">{app.company}</p>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cfg.bg} ${cfg.color} text-[10px] sm:text-xs font-medium whitespace-nowrap shrink-0`}>
                              <StepIcon className="w-3 h-3" />
                              {cfg.label}
                            </div>
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Ứng tuyển {app.appliedAt}
                          </p>

                          {/* Pipeline progress bar (only for active statuses) */}
                          {stepIdx >= 0 && (
                            <div className="mt-4">
                              <div className="flex items-center gap-0.5">
                                {pipelineSteps.slice(0, 5).map((step, i) => {
                                  const isActive = i <= stepIdx
                                  const isCurrent = i === stepIdx
                                  return (
                                    <div key={step} className="flex-1 flex items-center">
                                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${isActive ? "bg-primary" : "bg-muted"}`} />
                                      {isCurrent && <div className="w-2 h-2 rounded-full bg-primary ml-0.5 ring-2 ring-primary/20 animate-pulse" />}
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="flex justify-between mt-1.5">
                                {pipelineSteps.slice(0, 5).map((step, i) => (
                                  <span key={step} className={`text-[9px] sm:text-[10px] ${i <= stepIdx ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                    {statusConfig[step].label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {app.statusNote && stepIdx >= 0 && (
                            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5 p-2.5 rounded-lg bg-muted/50">
                              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                              {app.statusNote}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/20 flex items-center justify-end gap-2">
                        {stepIdx >= 0 && stepIdx <= 3 && (
                          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => withdrawApp(app.id)}>
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Rút đơn
                          </Button>
                        )}
                        <Link href={`/jobs/${app.id}`}>
                          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Xem job
                          </Button>
                        </Link>
                        {app.status === "interview" && (
                          <Button size="sm" className="h-8 rounded-lg text-xs">Xem lịch PV</Button>
                        )}
                        {app.status === "offered" && (
                          <Button size="sm" className="h-8 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700">Chấp nhận offer</Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
