"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerSm, fadeUp, slideLeft, btnTap } from "@/lib/animations"
import { useState } from "react"
import Link from "next/link"
import {
  Search, MapPin, DollarSign, Briefcase, Clock, Bookmark, Bell, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, Building2, CheckCircle2, Users,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Job {
  id: number
  title: string
  company: string
  location: string
  salary: string
  type: string
  mode: string
  tags: string[]
  posted: string
  urgent: boolean
}

const jobs: Job[] = [
  { id: 1, title: "Senior UX/UI Designer", company: "TechNova Solutions", location: "Quận 1, TP. Hồ Chí Minh", salary: "25 - 40 Triệu", type: "Fulltime", mode: "Hybrid", tags: ["Figma", "Design Systems", "Prototyping"], posted: "2 giờ trước", urgent: false },
  { id: 2, title: "Product Designer (Fintech)", company: "FinServe Global", location: "Quận 3, TP. Hồ Chí Minh", salary: "Lên đến $2,000", type: "Fulltime", mode: "Onsite", tags: ["User Research", "Wireframing", "Fintech"], posted: "Hôm qua", urgent: true },
  { id: 3, title: "UX Researcher", company: "Creative Minds Agency", location: "Remote", salary: "Thỏa thuận", type: "Fulltime", mode: "Remote", tags: ["User Testing", "Analytics"], posted: "3 ngày trước", urgent: false },
  { id: 4, title: "Frontend Developer (React)", company: "TechViet Innovations", location: "Quận 1, TP. Hồ Chí Minh", salary: "20 - 35 Triệu", type: "Fulltime", mode: "Hybrid", tags: ["React", "TypeScript", "Tailwind"], posted: "1 ngày trước", urgent: false },
  { id: 5, title: "Backend Engineer (Node.js)", company: "DataStream Inc.", location: "Remote", salary: "22 - 38 Triệu", type: "Fulltime", mode: "Remote", tags: ["Node.js", "PostgreSQL", "AWS"], posted: "5 ngày trước", urgent: false },
  { id: 6, title: "Product Manager", company: "TechViet Innovations", location: "Quận 1, TP. Hồ Chí Minh", salary: "30 - 50 Triệu", type: "Fulltime", mode: "Onsite", tags: ["Agile", "Product Strategy"], posted: "3 ngày trước", urgent: true },
]

export default function JobsPage() {
  const [savedJobs, setSavedJobs] = useState<Record<number, boolean>>({})
  const [appliedJobs, setAppliedJobs] = useState<Record<number, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState("")
  const [selectedSalary, setSelectedSalary] = useState("")
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedModes, setSelectedModes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("newest")

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }

  const toggleMode = (mode: string) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
    )
  }

  const clearFilters = () => {
    setSelectedLocation("")
    setSelectedSalary("")
    setSelectedTypes([])
    setSelectedModes([])
    setSearchQuery("")
  }

  const hasActiveFilters =
    selectedLocation !== "" ||
    selectedSalary !== "" ||
    selectedTypes.length > 0 ||
    selectedModes.length > 0 ||
    searchQuery.trim() !== ""

  const matchesSalary = (job: Job, range: string): boolean => {
    if (!range) return true
    if (range === "Thỏa thuận") return job.salary === "Thỏa thuận"
    const maxMatch = job.salary.match(/([\d,.]+)\s*(Triệu|\$)/)
    if (!maxMatch) return false
    const num = parseFloat(maxMatch[1].replace(/,/g, ""))
    const trongTriệu = maxMatch[2] === "$" ? num * 0.025 : num
    if (range === "Dưới 10 Triệu") return trongTriệu < 10
    if (range === "10 - 20 Triệu") return trongTriệu >= 10 && trongTriệu <= 20
    if (range === "20 - 40 Triệu") return trongTriệu > 20 && trongTriệu <= 40
    if (range === "Trên 40 Triệu") return trongTriệu > 40
    return false
  }

  const filtered = jobs.filter((job) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.tags.some((tag) => tag.toLowerCase().includes(q))
      if (!matchesSearch) return false
    }
    if (selectedLocation && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false
    }
    if (selectedSalary && !matchesSalary(job, selectedSalary)) {
      return false
    }
    if (selectedTypes.length > 0 && !selectedTypes.includes(job.type)) {
      return false
    }
    if (selectedModes.length > 0 && !selectedModes.includes(job.mode)) {
      return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return 0
    return 0
  })

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSavedJobs((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleApply = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setAppliedJobs((prev) => ({ ...prev, [id]: true }))
  }

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tìm việc làm</h1>
          <p className="text-sm text-muted-foreground">Khám phá cơ hội việc làm phù hợp với bạn</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-lg text-sm gap-1.5">
            <Bell className="w-4 h-4" /> Tạo thông báo việc làm
          </Button>
          <Button variant="outline" size="icon" className="rounded-lg lg:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className={`lg:col-span-3 ${showFilters ? "block" : "hidden lg:block"}`}>
          <Card className="bg-card border-border/30 rounded-xl p-5 sticky top-24">
            <motion.div variants={staggerSm} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground flex items-center gap-1.5">
                  <Filter className="w-4 h-4" /> Bộ lọc
                </h2>
                <button onClick={clearFilters} className="text-xs text-primary hover:opacity-80 transition-opacity">Xóa lọc</button>
              </motion.div>

            <motion.div variants={fadeUp} className="mb-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Địa điểm</h3>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-muted/40 border border-border/30 rounded-lg text-sm focus:outline-none focus:border-primary appearance-none text-foreground"
                >
                  <option value="">Tất cả địa điểm</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mức lương</h3>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-muted/40 border border-border/30 rounded-lg text-sm focus:outline-none focus:border-primary appearance-none text-foreground"
                >
                  <option value="">Tất cả mức lương</option>
                  <option value="Dưới 10 Triệu">Dưới 10 Triệu</option>
                  <option value="10 - 20 Triệu">10 - 20 Triệu</option>
                  <option value="20 - 40 Triệu">20 - 40 Triệu</option>
                  <option value="Trên 40 Triệu">Trên 40 Triệu</option>
                  <option value="Thỏa thuận">Thỏa thuận</option>
                </select>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Loại công việc</h3>
              <div className="space-y-2.5">
                {["Fulltime", "Parttime", "Internship", "Contract", "Freelance"].map((type) => (
                  <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                      className="rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="mb-5">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hình thức làm việc</h3>
              <div className="space-y-2.5">
                {["Onsite", "Remote", "Hybrid"].map((mode) => (
                  <label key={mode} className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      checked={selectedModes.includes(mode)}
                      onCheckedChange={() => toggleMode(mode)}
                      className="rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">{mode}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            {hasActiveFilters && (
              <motion.div variants={fadeUp} className="flex flex-wrap gap-1.5">
                {selectedLocation && (
                  <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setSelectedLocation("")}>
                    {selectedLocation} ✕
                  </Badge>
                )}
                {selectedSalary && (
                  <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setSelectedSalary("")}>
                    {selectedSalary} ✕
                  </Badge>
                )}
                {selectedTypes.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggleType(t)}>
                    {t} ✕
                  </Badge>
                ))}
                {selectedModes.map((m) => (
                  <Badge key={m} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggleMode(m)}>
                    {m} ✕
                  </Badge>
                ))}
              </motion.div>
            )}
            </motion.div>
          </Card>
        </aside>

        <section className="lg:col-span-9 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm việc làm theo kỹ năng, chức vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-card border-border/30 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Tìm thấy <span className="font-semibold text-foreground">{sorted.length}</span> công việc
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 bg-card border border-border/30 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary appearance-none"
              >
                <option value="newest">Mới nhất</option>
              </select>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-headline font-bold text-lg text-foreground">Không tìm thấy công việc</h3>
              <p className="text-sm text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            </div>
          ) : (
          <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-3">
            {sorted.map((job) => (
              <motion.div variants={fadeUp} key={job.id}>
                <Card className="bg-card rounded-xl p-5 border border-border/30 transition-all group">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/jobs/${job.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                          {job.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => toggleSave(job.id, e)} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors">
                          <Bookmark className={`w-4 h-4 ${savedJobs[job.id] ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400"><DollarSign className="w-3 h-3" /> {job.salary}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {job.type} • {job.mode}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {[...job.tags].sort((a, b) => a.localeCompare(b)).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-border/30 text-xs font-normal">{tag}</Badge>
                      ))}
                      {job.urgent && (
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0 text-xs">Đang tuyển gấp</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="w-3 h-3" /> Đăng {job.posted}</span>
                      <div className="flex items-center gap-2">
                        <motion.div {...btnTap}>
                          <Button
                            onClick={(e) => handleApply(job.id, e)}
                            variant={appliedJobs[job.id] ? "secondary" : "default"}
                            size="sm"
                            className={`rounded-lg text-xs h-8 ${appliedJobs[job.id] ? "pointer-events-none" : ""}`}
                          >
                            {appliedJobs[job.id] ? <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã ứng tuyển</> : "Easy Apply"}
                          </Button>
                        </motion.div>
                        <motion.div {...btnTap}>
                          <Button variant="outline" size="sm" className="rounded-lg text-xs h-8" asChild>
                            <Link href={`/jobs/${job.id}`}>Chi tiết</Link>
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
            ))}
          </motion.div>
          )}

          <div className="flex justify-center pt-4">
            <nav className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled className="w-10 h-10 rounded-xl border-border/30">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button className="w-10 h-10 rounded-xl">1</Button>
              <Button variant="outline" className="w-10 h-10 rounded-xl border-border/30">2</Button>
              <Button variant="outline" className="w-10 h-10 rounded-xl border-border/30">3</Button>
              <span className="text-muted-foreground px-1">...</span>
              <Button variant="outline" className="w-10 h-10 rounded-xl border-border/30">12</Button>
              <Button variant="outline" size="icon" className="w-10 h-10 rounded-xl border-border/30">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
