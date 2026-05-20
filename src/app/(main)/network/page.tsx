"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Search, UserPlus, Check, X, MessageCircle,
  Users, MapPin, Building2, Send,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const suggestions = [
  { id: 1, name: "Trần Hoàng", initials: "TH", title: "Product Manager", company: "VNG", mutual: 12 },
  { id: 2, name: "Lê Vy", initials: "LV", title: "Recruiter", company: "FPT Software", mutual: 8 },
  { id: 3, name: "Phạm Minh", initials: "PM", title: "Fullstack Developer", company: "VNPT", mutual: 5 },
  { id: 4, name: "Hoàng Yến", initials: "HY", title: "Marketing Lead", company: "Shopee", mutual: 15 },
  { id: 5, name: "Đỗ Văn", initials: "ĐV", title: "CTO", company: "TechStartup", mutual: 3 },
  { id: 6, name: "Minh Anh", initials: "MA", title: "Data Scientist", company: "VNG", mutual: 7 },
  { id: 7, name: "Quốc Bình", initials: "QB", title: "Backend Developer", company: "Shopee", mutual: 9 },
  { id: 8, name: "Thanh Thảo", initials: "TT", title: "HR Manager", company: "TechCorp VN", mutual: 6 },
  { id: 9, name: "Hữu Phước", initials: "HP", title: "DevOps Engineer", company: "VNG", mutual: 4 },
  { id: 10, name: "Kim Ngân", initials: "KN", title: "UI Designer", company: "DesignHub", mutual: 11 },
  { id: 11, name: "Đức Trung", initials: "ĐT", title: "Mobile Developer", company: "FPT Software", mutual: 2 },
  { id: 12, name: "Mai Phương", initials: "MP", title: "Data Analyst", company: "TechViet", mutual: 10 },
  { id: 13, name: "Anh Tuấn", initials: "AT", title: "Solution Architect", company: "NashTech", mutual: 8 },
  { id: 14, name: "Bích Ngọc", initials: "BN", title: "QA Lead", company: "KMS", mutual: 6 },
  { id: 15, name: "Công Minh", initials: "CM", title: "Technical Writer", company: "NashTech", mutual: 4 },
  { id: 16, name: "Diễm Quỳnh", initials: "DQ", title: "Scrum Master", company: "FPT Software", mutual: 7 },
]

const myConnections = [
  { id: 101, name: "Quốc Bình", initials: "QB", title: "Backend Developer", company: "Shopee", location: "Singapore" },
  { id: 102, name: "Thanh Thảo", initials: "TT", title: "HR Manager", company: "TechCorp VN", location: "TP. Hồ Chí Minh" },
  { id: 103, name: "Hữu Phước", initials: "HP", title: "DevOps Engineer", company: "VNG", location: "TP. Hồ Chí Minh" },
  { id: 104, name: "Kim Ngân", initials: "KN", title: "UI Designer", company: "DesignHub", location: "Hà Nội" },
  { id: 105, name: "Đức Trung", initials: "ĐT", title: "Mobile Developer", company: "FPT Software", location: "Đà Nẵng" },
  { id: 106, name: "Mai Phương", initials: "MP", title: "Data Analyst", company: "TechViet", location: "Hồ Chí Minh" },
  { id: 107, name: "Anh Tuấn", initials: "AT", title: "Solution Architect", company: "NashTech", location: "Hồ Chí Minh" },
  { id: 108, name: "Bích Ngọc", initials: "BN", title: "QA Lead", company: "KMS", location: "Đà Nẵng" },
  { id: 109, name: "Công Minh", initials: "CM", title: "Technical Writer", company: "NashTech", location: "Hà Nội" },
  { id: 110, name: "Diễm Quỳnh", initials: "DQ", title: "Scrum Master", company: "FPT Software", location: "Đà Nẵng" },
]

const invitations = [
  { id: 201, name: "Lê Hoàng", initials: "LH", title: "Frontend Developer", company: "VMO Holdings", mutual: 3 },
  { id: 202, name: "Thu Trang", initials: "TT", title: "Business Analyst", company: "KMS Technology", mutual: 7 },
]

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 18 } },
}

export default function NetworkPage() {
  const [suggestionsState, setSuggestionsState] = useState(suggestions.map(s => ({ ...s, status: "none" as "none" | "pending" })))
  const [searchQuery, setSearchQuery] = useState("")
  const [tab, setTab] = useState("suggestions")

  const toggleConnect = (id: number) => {
    setSuggestionsState(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "none" ? "pending" : "none" } : s))
  }

  const filtered = suggestionsState.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="max-w-5xl mx-auto space-y-5 pb-6">
      {/* Header */}
      <div>
        <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground">Mạng lưới</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kết nối và mở rộng mạng lưới quan hệ của bạn</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10 h-10 rounded-xl bg-muted/50 border-border/30 text-sm focus:bg-card"
          placeholder="Tìm kiếm theo tên, kỹ năng, công ty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto">
          <TabsTrigger value="suggestions" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
            Gợi ý
          </TabsTrigger>
          <TabsTrigger value="connections" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
            Kết nối ({myConnections.length})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="rounded-lg text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
            Lời mời {invitations.length > 0 && `(${invitations.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="mt-5 focus-visible:outline-none">
          {filtered.length === 0 ? (
            <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="font-headline font-bold text-base text-foreground">Không tìm thấy</h3>
              <p className="text-sm text-muted-foreground mt-1">Thử thay đổi từ khóa tìm kiếm của bạn</p>
            </Card>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3"
            >
              {filtered.map((s) => (
                <motion.div key={s.id} variants={fadeUp}>
                  <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all h-full group">
                    <div className="flex flex-col items-center text-center gap-1.5 h-full">
                      <Link href={`/profile/${s.id}`}>
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-border/20 cursor-pointer group-hover:ring-2 group-hover:ring-primary/30 transition-all">
                          <AvatarImage src="https://emmariani.github.io/cartoon-hero/img/mode.jpg" />
                          <AvatarFallback className="text-xs sm:text-sm">{s.initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <Link href={`/profile/${s.id}`} className="font-semibold text-xs sm:text-sm text-foreground hover:text-primary hover:underline leading-tight line-clamp-1 mt-0.5">
                        {s.name}
                      </Link>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight line-clamp-1">{s.title}</p>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{s.company}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60">{s.mutual} bạn chung</span>
                      <div className="flex gap-1.5 mt-auto pt-2 w-full">
                        <Button
                          variant={s.status === "pending" ? "secondary" : "default"}
                          size="sm"
                          className={`flex-1 h-8 rounded-lg text-[10px] sm:text-xs ${s.status === "pending" ? "" : ""}`}
                          onClick={() => toggleConnect(s.id)}
                        >
                          {s.status === "pending" ? <><X className="w-3 h-3 mr-1" /> Hủy</> : <><UserPlus className="w-3 h-3 mr-1" /> Kết nối</>}
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 sm:w-auto sm:px-2.5 rounded-lg text-[10px] sm:text-xs">
                          <MessageCircle className="w-3 h-3 sm:mr-1" />
                          <span className="hidden sm:inline">Chat</span>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-5 focus-visible:outline-none">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <Card className="bg-card border-border/30 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border/30 flex items-center justify-between">
                <h2 className="font-headline font-bold text-sm sm:text-base text-foreground">
                  Tất cả kết nối <span className="text-muted-foreground font-normal">({myConnections.length})</span>
                </h2>
                <div className="relative w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input className="pl-8 h-8 rounded-lg bg-muted/50 border-none text-xs" placeholder="Tìm trong kết nối..." />
                </div>
              </div>
              <div className="divide-y divide-border/20">
                {myConnections.map((conn) => (
                  <motion.div key={conn.id} variants={fadeUp}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 hover:bg-muted/20 transition-colors"
                  >
                    <Link href={`/profile/${conn.id}`}>
                      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border border-border/20 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                        <AvatarImage src="https://emmariani.github.io/cartoon-hero/img/mode.jpg" />
                        <AvatarFallback className="text-xs">{conn.initials}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${conn.id}`} className="font-semibold text-sm text-foreground hover:text-primary hover:underline transition-colors block truncate">
                        {conn.name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{conn.title} tại {conn.company}</p>
                      <p className="text-[11px] text-muted-foreground/70 flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-0.5" /> {conn.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs px-2.5">
                        <MessageCircle className="w-3.5 h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Nhắn tin</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-muted-foreground">
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="invitations" className="mt-5 focus-visible:outline-none">
          {invitations.length > 0 ? (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
              {invitations.map((inv) => (
                <motion.div key={inv.id} variants={fadeUp}>
                  <Card className="bg-card border-border/30 rounded-xl p-4 hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/20">
                        <AvatarImage src="https://emmariani.github.io/cartoon-hero/img/mode.jpg" />
                        <AvatarFallback className="text-xs">{inv.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{inv.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{inv.title} tại {inv.company}</p>
                        <span className="text-[11px] text-muted-foreground/70">{inv.mutual} bạn chung</span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" className="h-8 sm:h-9 rounded-lg text-xs px-3">
                          <Check className="w-3.5 h-3.5 mr-1" /> Chấp nhận
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 sm:h-9 rounded-lg text-xs px-3">
                          <X className="w-3.5 h-3.5 mr-1" /> Từ chối
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <Card className="bg-card border-border/30 rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-muted-foreground/50" />
              </div>
              <h3 className="font-headline font-bold text-base sm:text-lg text-foreground">Không có lời mời</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Bạn chưa có lời mời kết nối nào. Hãy chủ động kết nối với mọi người nhé!
              </p>
              <Button variant="outline" className="mt-4 rounded-lg text-sm" onClick={() => setTab("suggestions")}>
                <UserPlus className="w-4 h-4 mr-1.5" /> Khám phá gợi ý
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
