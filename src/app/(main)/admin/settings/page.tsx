"use client"

import { motion } from "framer-motion"
import { pageEntrance, staggerMd, fadeUp } from "@/lib/animations"
import { useState } from "react"
import {
  Globe, Mail, Lock, Smartphone, MapPin, Save, Send,
  LayoutDashboard, Users, Building2, Flag, ScrollText, Settings,
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("identity")

  return (
    <motion.div variants={pageEntrance} initial="hidden" animate="show" className="flex gap-6">
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <Card className="bg-card border-border/30 rounded-xl p-2 sticky top-24">
          {[
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
            { label: "Users", icon: Users, href: "/admin/users" },
            { label: "Companies", icon: Building2, href: "/admin/companies" },
            { label: "Reports", icon: Flag, href: "/admin/reports" },
            { label: "Audit Log", icon: ScrollText, href: "/admin/audit-log" },
            { label: "Settings", icon: Settings, href: "/admin/settings", active: true },
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
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground">Cấu hình hệ thống</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/60 p-1 rounded-xl flex-wrap">
            <TabsTrigger value="identity" className="rounded-lg text-sm px-4 gap-1.5">
              <Globe className="w-4 h-4" /> Site Identity
            </TabsTrigger>
            <TabsTrigger value="smtp" className="rounded-lg text-sm px-4 gap-1.5">
              <Mail className="w-4 h-4" /> SMTP
            </TabsTrigger>
            <TabsTrigger value="recaptcha" className="rounded-lg text-sm px-4 gap-1.5">
              <Lock className="w-4 h-4" /> reCAPTCHA
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-lg text-sm px-4 gap-1.5">
              <Smartphone className="w-4 h-4" /> Contact
            </TabsTrigger>
            <TabsTrigger value="regional" className="rounded-lg text-sm px-4 gap-1.5">
              <MapPin className="w-4 h-4" /> Regional
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="mt-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card border-border/30 rounded-xl p-6">
              <motion.div variants={staggerMd} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={fadeUp}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Site Name</label>
                  <Input defaultValue="Việc Làm Pro" className="rounded-lg max-w-md" />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Site Description</label>
                  <Textarea defaultValue="Nền tảng tuyển dụng hàng đầu Việt Nam" className="rounded-lg max-w-md resize-none" rows={3} />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Logo URL</label>
                  <Input defaultValue="https://example.com/logo.png" className="rounded-lg max-w-md" />
                </motion.div>
                <motion.div variants={fadeUp}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Favicon URL</label>
                  <Input defaultValue="https://example.com/favicon.ico" className="rounded-lg max-w-md" />
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="smtp" className="mt-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card border-border/30 rounded-xl p-6">
              <motion.div variants={staggerMd} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={fadeUp}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">SMTP Host</label>
                      <Input defaultValue="smtp.gmail.com" className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">SMTP Port</label>
                      <Input defaultValue="587" className="rounded-lg" />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
                      <Input defaultValue="noreply@example.com" className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                      <Input type="password" defaultValue="********" className="rounded-lg" />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Encryption</label>
                    <Select defaultValue="tls">
                      <SelectTrigger className="w-full sm:w-48 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="tls">TLS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">From Email</label>
                      <Input defaultValue="noreply@example.com" className="rounded-lg" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">From Name</label>
                      <Input defaultValue="Việc Làm Pro" className="rounded-lg" />
                    </div>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Button variant="outline" className="rounded-lg gap-1.5">
                    <Send className="w-4 h-4" /> Gửi email test
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="recaptcha" className="mt-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card border-border/30 rounded-xl p-6">
              <motion.div variants={staggerMd} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Site Key</label>
                    <Input defaultValue="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" className="rounded-lg max-w-md" />
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Secret Key</label>
                    <Input type="password" defaultValue="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe" className="rounded-lg max-w-md" />
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Enabled Pages</p>
                    <div className="space-y-3">
                      {["Login", "Register", "Forgot Password", "Contact Form", "Report Form"].map((page) => (
                        <label key={page} className="flex items-center gap-2.5 cursor-pointer group">
                          <Checkbox defaultChecked className="rounded-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                          <span className="text-sm text-foreground group-hover:text-primary transition-colors">{page}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card border-border/30 rounded-xl p-6">
              <motion.div variants={staggerMd} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                    <Input defaultValue="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh" className="rounded-lg max-w-md" />
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                    <Input defaultValue="contact@vieclampro.vn" className="rounded-lg max-w-md" />
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                    <Input defaultValue="+84 28 3822 1234" className="rounded-lg max-w-md" />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="regional" className="mt-6">
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="bg-card border-border/30 rounded-xl p-6">
              <motion.div variants={staggerMd} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Locale</label>
                    <Select defaultValue="vi">
                      <SelectTrigger className="w-full sm:w-48 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Timezone</label>
                    <Select defaultValue="asia-ho-chi-minh">
                      <SelectTrigger className="w-full sm:w-64 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-ho-chi-minh">Asia/Ho_Chi_Minh (UTC+7)</SelectItem>
                        <SelectItem value="asia-hanoi">Asia/Ha_Noi (UTC+7)</SelectItem>
                        <SelectItem value="asia-bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                        <SelectItem value="asia-singapore">Asia/Singapore (UTC+8)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Currency</label>
                    <Input defaultValue="VND" className="rounded-lg max-w-xs" />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button className="rounded-lg gap-1.5">
            <Save className="w-4 h-4" /> Save Settings
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
