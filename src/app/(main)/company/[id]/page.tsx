"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { pageEntrance, staggerMd, fadeUp, staggerSm, btnTap } from "@/lib/animations"
import {
  Building2, MapPin, Globe, Users, Briefcase, Check, Plus, Bell,
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const company = {
  name: "TechViet Innovations",
  industry: "Công nghệ thông tin",
  location: "Quận 1, TP. Hồ Chí Minh",
  website: "https://techviet.vn",
  about: "TechViet Innovations là công ty công nghệ hàng đầu tại Việt Nam, chuyên cung cấp các giải pháp phần mềm doanh nghiệp và sản phẩm số cho thị trường trong nước và quốc tế. Với hơn 10 năm kinh nghiệm, chúng tôi đã xây dựng một đội ngũ nhân sự tài năng và môi trường làm việc năng động, sáng tạo.",
  followers: 1240,
  jobs: 12,
  employees: "200-500",
  verified: true,
  openToHire: true,
}

const activeJobs = [
  {
    id: 1, title: "Senior UX/UI Designer", location: "Quận 1, TP. HCM",
    salary: "25-40 Triệu", type: "Fulltime",
  },
  {
    id: 2, title: "Frontend Developer (React)", location: "Quận 1, TP. HCM",
    salary: "20-35 Triệu", type: "Fulltime",
  },
  {
    id: 3, title: "Product Manager", location: "Quận 1, TP. HCM",
    salary: "30-50 Triệu", type: "Fulltime",
  },
  {
    id: 4, title: "Backend Engineer (Node.js)", location: "Remote",
    salary: "22-38 Triệu", type: "Fulltime",
  },
]

export default function CompanyPage({ params }: { params: { id: string } }) {
  const [following, setFollowing] = useState(false)

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/5 to-purple-500/20 relative" />
          <div className="px-6 pb-6 -mt-12 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 mb-4">
              <Avatar className="w-24 h-24 rounded-2xl border-4 border-card shadow-lg">
                <AvatarFallback className="rounded-2xl bg-primary/20 text-2xl font-bold">
                  <Building2 className="w-10 h-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
                  {company.verified && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1">
                      <Check className="w-3 h-3" /> Đã xác minh
                    </Badge>
                  )}
                  {company.openToHire && (
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-xs">
                      Open to Hire
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">{company.industry}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {company.location}</span>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto">
                <motion.span {...btnTap}>
                  <Button
                    onClick={() => setFollowing(!following)}
                    variant={following ? "secondary" : "default"}
                    className="rounded-lg"
                  >
                    {following ? <Bell className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                    {following ? "Đang theo dõi" : "Theo dõi"}
                  </Button>
                </motion.span>
              </div>
            </div>

            <motion.div variants={staggerMd} initial="hidden" animate="show" className="grid grid-cols-3 gap-4 py-4 border-t border-border/30">
              <motion.div variants={fadeUp} className="text-center">
                <p className="text-xl font-bold text-foreground">{company.jobs}</p>
                <p className="text-xs text-muted-foreground">Việc làm</p>
              </motion.div>
              <motion.div variants={fadeUp} className="text-center border-x border-border/30">
                <p className="text-xl font-bold text-foreground">{company.followers}</p>
                <p className="text-xs text-muted-foreground">Người theo dõi</p>
              </motion.div>
              <motion.div variants={fadeUp} className="text-center">
                <p className="text-xl font-bold text-foreground">{company.employees}</p>
                <p className="text-xs text-muted-foreground">Nhân viên</p>
              </motion.div>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <Card className="bg-card border-border/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Giới thiệu</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{company.about}</p>
        </Card>
      </motion.div>

      <motion.div variants={staggerSm} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Việc làm đang tuyển ({activeJobs.length})</h2>
        </div>
        <div className="space-y-3">
          {activeJobs.map((job) => (
            <motion.div key={job.id} variants={fadeUp}>
              <Card className="bg-card border-border/30 rounded-xl p-4 group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${job.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                    {job.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.type}</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">{job.salary}</span>
                  </div>
                </div>
                <motion.span {...btnTap}>
                  <Button variant="outline" size="sm" className="rounded-lg shrink-0 text-xs" asChild>
                    <Link href={`/jobs/${job.id}`}>Xem chi tiết</Link>
                  </Button>
                </motion.span>
              </div>
            </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
