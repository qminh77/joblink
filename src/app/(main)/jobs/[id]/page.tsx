"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerMd, fadeUp, slideRight } from "@/lib/animations"
import { useState } from "react"
import Link from "next/link"
import {
  Briefcase, MapPin, DollarSign, Clock, Building2, Send, Bookmark, Share2, ChevronRight, CheckCircle2, Circle, Check,
  FileText, Plus,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

const stages = [
  { key: "applied", label: "Đã nộp", complete: true },
  { key: "reviewed", label: "Đã xem", complete: true },
  { key: "interview", label: "Phỏng vấn", complete: true },
  { key: "offered", label: "Đề nghị", complete: false },
  { key: "hired", label: "Tuyển dụng", complete: false },
]

const similarJobs = [
  { id: 101, title: "Frontend Engineer (React)", company: "InnovateTech VN", location: "TP. Hồ Chí Minh", salary: "20-35M" },
  { id: 102, title: "UI/UX Developer", company: "Creative Designs Co.", location: "Hybrid", salary: "18-30M" },
  { id: 103, title: "Full Stack Developer", company: "DataCore Systems", location: "Remote", salary: "25-45M" },
]

const mockCVs = [
  { id: "1", name: "CV Mặc định", type: "from_profile", desc: "Tự động tạo từ thông tin hồ sơ", isDefault: true },
  { id: "2", name: "CV Thiết kế", type: "custom", desc: "Tập trung kinh nghiệm UI/UX", isDefault: false },
]

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [hasApplied, setHasApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [selectedCV, setSelectedCV] = useState("1")
  const [applying, setApplying] = useState(false)

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      <div className="lg:col-span-8">
        <motion.div variants={staggerMd} initial="hidden" animate="show" className="flex flex-col gap-6">
        <motion.div variants={fadeUp}>
        <Card className="bg-card rounded-[24px] p-6 md:p-8 border border-border/30">
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Senior Frontend Developer (React/Vue)</h1>
                  <Link href="/company/1" className="text-primary hover:opacity-80 transition-opacity font-medium text-sm">
                    TechCorp Solutions VN
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Quận 1, TP. Hồ Chí Minh</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> 25-40 Triệu</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 2 ngày trước</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {hasApplied ? (
                    <Button variant="secondary" className="rounded-xl pointer-events-none">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Đã ứng tuyển
                    </Button>
                  ) : (
                    <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
                      <Button onClick={() => setShowApplyDialog(true)} className="rounded-xl">
                        <Send className="w-4 h-4 mr-1.5" /> Easy Apply
                      </Button>
                      <DialogContent className="sm:max-w-md rounded-xl">
                        <DialogHeader>
                          <DialogTitle>Ứng tuyển vị trí</DialogTitle>
                          <DialogDescription>Senior Frontend Developer (React/Vue) tại TechCorp Solutions VN</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium text-foreground mb-3">Chọn CV để gửi</p>
                            <RadioGroup value={selectedCV} onValueChange={setSelectedCV} className="space-y-2">
                              {mockCVs.map((cv) => (
                                <div key={cv.id} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                                  selectedCV === cv.id ? "border-primary bg-primary/5" : "border-border/30 hover:border-border/60"
                                }`}>
                                  <RadioGroupItem value={cv.id} id={`cv-${cv.id}`} className="mt-0.5" />
                                  <Label htmlFor={`cv-${cv.id}`} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2">
                                      <FileText className={`w-4 h-4 ${selectedCV === cv.id ? "text-primary" : "text-muted-foreground"}`} />
                                      <span className="font-medium text-sm text-foreground">{cv.name}</span>
                                      {cv.isDefault && <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-2 rounded-full">Mặc định</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{cv.desc}</p>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                          <Link href="/profile/edit" className="flex items-center gap-2 text-xs text-primary hover:opacity-80 transition-opacity">
                            <Plus className="w-3.5 h-3.5" /> Quản lý CV
                          </Link>
                        </div>
                        <DialogFooter className="gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowApplyDialog(false)}>Hủy</Button>
                          <Button size="sm" className="rounded-lg" onClick={() => {
                            setApplying(true)
                            setTimeout(() => {
                              setHasApplied(true)
                              setApplying(false)
                              setShowApplyDialog(false)
                            }, 800)
                          }} disabled={applying}>
                            {applying ? "Đang gửi..." : "Gửi ứng tuyển"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setSaved(!saved)}>
                      <Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : ""}`} />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0">Fulltime</Badge>
                <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0">Hybrid</Badge>
                <Badge variant="outline" className="border-border/30">25-40 Triệu</Badge>
              </div>
            </div>
          </div>
        </Card>
        </motion.div>

        {hasApplied && (
          <motion.div variants={fadeUp}>
          <Card className="bg-card rounded-[24px] p-6 border border-border/30">
            <button onClick={() => setShowTimeline(!showTimeline)} className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold text-foreground">Trạng thái ứng tuyển</h2>
              <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showTimeline ? "rotate-90" : ""}`} />
            </button>
            {showTimeline && (
              <div className="mt-4 space-y-0">
                {stages.map((stage, i) => (
                  <div key={stage.key} className="flex items-start gap-3 pb-4 relative">
                    {i < stages.length - 1 && (
                      <div className="absolute left-[11px] top-6 w-px h-full bg-border" />
                    )}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      stage.complete ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                    }`}>
                      {stage.complete ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${stage.complete ? "text-foreground" : "text-muted-foreground"}`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stage.complete ? "Hoàn thành" : "Đang chờ"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
        <Card className="bg-card rounded-[24px] p-6 md:p-8 border border-border/30">
          <h2 className="text-lg font-bold text-foreground mb-4 pb-4 border-b border-border/30">Mô tả công việc</h2>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
            <p>Chúng tôi đang tìm kiếm một Senior Frontend Developer đam mê công nghệ để gia nhập đội ngũ phát triển sản phẩm cốt lõi. Bạn sẽ đóng vai trò quan trọng trong việc xây dựng các giao diện người dùng mượt mà, tối ưu hóa hiệu suất và mang lại trải nghiệm tuyệt vời cho hàng triệu người dùng.</p>
            <ul className="space-y-3">
              {["Phát triển và bảo trì các tính năng frontend sử dụng React.js hoặc Vue.js.",
                "Cộng tác chặt chẽ với đội ngũ UX/UI Designer để chuyển đổi thiết kế thành các thành phần UI/UX chất lượng cao.",
                "Tối ưu hóa ứng dụng web để đạt hiệu suất tối đa, tốc độ tải trang nhanh.",
                "Tham gia review code, định hướng kỹ thuật và chia sẻ kiến thức với các thành viên junior.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
        <Card className="bg-card rounded-[24px] p-6 md:p-8 border border-border/30">
          <h2 className="text-lg font-bold text-foreground mb-4 pb-4 border-b border-border/30">Yêu cầu</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {["Tối thiểu 3 năm kinh nghiệm với React.js hoặc Vue.js.",
              "Nắm vững HTML5, CSS3, JavaScript (ES6+), TypeScript.",
              "Kinh nghiệm với Redux, Vuex, hoặc Zustand.",
              "Hiểu biết về RESTful APIs.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
        </motion.div>
        </motion.div>
      </div>

      <aside className="lg:col-span-4">
        <motion.div variants={slideRight} initial="hidden" animate="show" className="flex flex-col gap-6">
        <motion.div variants={fadeUp}>
        <Card className="bg-card rounded-2xl p-6 border border-border/30 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <Link href="/company/1" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
            TechCorp Solutions VN
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Phần mềm & Dịch vụ CNTT</p>
          <a href="#" className="text-primary text-xs hover:opacity-80 transition-opacity mt-1 inline-block">https://techcorp.vn</a>

          <div className="flex justify-between text-sm my-5 px-4">
            <div>
              <p className="font-bold text-foreground text-lg">500+</p>
              <p className="text-xs text-muted-foreground">Nhân viên</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="font-bold text-foreground text-lg">25</p>
              <p className="text-xs text-muted-foreground">Việc làm</p>
            </div>
          </div>

          <Button className="w-full rounded-xl" asChild>
            <Link href="/company/1">Xem trang công ty</Link>
          </Button>
        </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
        <Card className="bg-card rounded-2xl p-6 border border-border/30">
          <h3 className="font-bold text-foreground mb-4">Công việc tương tự</h3>
          <div className="space-y-3">
            {similarJobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{job.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {job.location} • {job.salary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        </motion.div>
        </motion.div>
      </aside>
    </motion.div>
  )
}
