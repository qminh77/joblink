"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { pageEntrance, staggerMd, fadeUp, staggerSm, btnTap } from "@/lib/animations"
import {
  Briefcase, X, Plus,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PostJobPage() {
  const [skills, setSkills] = useState<string[]>(["Figma", "UI/UX", "Prototyping"])
  const [newSkill, setNewSkill] = useState("")
  const [benefits, setBenefits] = useState([
    "Mức lương cạnh tranh",
    "Bảo hiểm sức khỏe",
    "Môi trường làm việc chuyên nghiệp",
  ])
  const [newBenefit, setNewBenefit] = useState("")

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill))

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      setBenefits([...benefits, newBenefit.trim()])
      setNewBenefit("")
    }
  }

  const removeBenefit = (benefit: string) => setBenefits(benefits.filter(b => b !== benefit))

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-headline font-bold text-2xl text-foreground">Đăng tin tuyển dụng</h1>
        <p className="text-sm text-muted-foreground mt-1">Tạo tin tuyển dụng mới cho công ty của bạn</p>
      </div>

      <motion.form variants={staggerMd} initial="hidden" animate="show" onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/30 rounded-xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-6">Thông tin cơ bản</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title" className="font-medium">Tiêu đề công việc</Label>
                <Input id="title" placeholder="Ví dụ: Senior UX/UI Designer" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="font-medium">Công ty</Label>
                <Input id="company" defaultValue="TechViet Innovations" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="font-medium">Địa điểm</Label>
                <Input id="location" placeholder="Ví dụ: Hồ Chí Minh" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="font-medium">Loại hình</Label>
                <Select>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Chọn loại hình" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fulltime">Full-time</SelectItem>
                    <SelectItem value="parttime">Part-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="work-mode" className="font-medium">Hình thức làm việc</Label>
                <Select>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Chọn hình thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-min" className="font-medium">Mức lương tối thiểu</Label>
                <Input id="salary-min" type="number" placeholder="1,000" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-max" className="font-medium">Mức lương tối đa</Label>
                <Input id="salary-max" type="number" placeholder="3,000" className="h-11 rounded-xl" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/30 rounded-xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-6">Mô tả công việc</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description" className="font-medium">Mô tả</Label>
                <Textarea id="description" rows={6} className="rounded-xl resize-none" placeholder="Mô tả chi tiết về công việc, trách nhiệm, yêu cầu..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requirements" className="font-medium">Yêu cầu</Label>
                <Textarea id="requirements" rows={4} className="rounded-xl resize-none" placeholder="Yêu cầu về kinh nghiệm, kỹ năng, học vấn..." />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/30 rounded-xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-4">Kỹ năng yêu cầu</h2>
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <motion.span key={skill} variants={fadeUp} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                </motion.span>
              ))}
            </motion.div>
            <div className="flex gap-2">
              <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Thêm kỹ năng..." className="h-10 rounded-xl flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} />
              <motion.span {...btnTap}>
                <Button type="button" variant="outline" className="rounded-xl h-10" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
              </motion.span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="bg-card border-border/30 rounded-xl p-6">
            <h2 className="font-headline font-bold text-lg text-foreground mb-4">Quyền lợi & Phúc lợi</h2>
            <motion.div variants={staggerSm} initial="hidden" animate="show" className="space-y-2 mb-4">
              {benefits.map((benefit) => (
                <motion.div key={benefit} variants={fadeUp} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                  <span className="text-sm text-foreground">{benefit}</span>
                  <button onClick={() => removeBenefit(benefit)} className="text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </motion.div>
            <div className="flex gap-2">
              <Input value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="Thêm quyền lợi..." className="h-10 rounded-xl flex-1" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addBenefit(); } }} />
              <motion.span {...btnTap}>
                <Button type="button" variant="outline" className="rounded-xl h-10" onClick={addBenefit}><Plus className="w-4 h-4" /></Button>
              </motion.span>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} className="flex items-center justify-end gap-3">
          <Link href="/company/dashboard">
            <motion.span {...btnTap}>
              <Button variant="outline" className="rounded-xl">Hủy</Button>
            </motion.span>
          </Link>
          <motion.span {...btnTap}>
            <Button type="submit" className="rounded-xl px-8">
              <Briefcase className="w-4 h-4 mr-1.5" />
              Đăng tin tuyển dụng
            </Button>
          </motion.span>
        </motion.div>
      </motion.form>
    </motion.div>
  )
}
