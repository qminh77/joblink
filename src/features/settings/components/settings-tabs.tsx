"use client"

import { Bell, Globe, Shield, User } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SessionUserSummary } from "@/features/auth/types"
import type {
  CompanyProfileDetail,
  MemberProfileDetail,
} from "@/features/profile/types"

import { AccountInfoCard } from "./account-info-card"
import { OpenToHireCard } from "./open-to-hire-card"
import { PrivacyCard } from "./privacy-card"

type Profile =
  | { kind: "member"; data: MemberProfileDetail }
  | { kind: "company"; data: CompanyProfileDetail }
  | null

const NOTIFICATION_PLACEHOLDERS = [
  { label: "Thích bài viết", desc: "Khi ai đó thích bài viết của bạn", checked: true },
  { label: "Bình luận", desc: "Khi ai đó bình luận bài viết", checked: true },
  { label: "Kết nối mới", desc: "Khi ai đó gửi lời mời kết nối", checked: true },
  { label: "Tin nhắn", desc: "Khi bạn nhận được tin nhắn mới", checked: true },
  { label: "Việc làm gợi ý", desc: "Khi có việc làm phù hợp với bạn", checked: false },
]

export function SettingsTabs({
  user,
  profile,
  locale,
}: {
  user: SessionUserSummary
  profile: Profile
  locale: string
}) {
  return (
    <Tabs defaultValue="account">
      <TabsList className="bg-muted/60 p-1 rounded-xl overflow-x-auto">
        <TabsTrigger
          value="account"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <User className="w-4 h-4 mr-1.5" /> Tài khoản
        </TabsTrigger>
        <TabsTrigger
          value="privacy"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Shield className="w-4 h-4 mr-1.5" /> Quyền riêng tư
        </TabsTrigger>
        <TabsTrigger
          value="notifications"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Bell className="w-4 h-4 mr-1.5" /> Thông báo
        </TabsTrigger>
        <TabsTrigger
          value="language"
          className="rounded-lg text-sm px-4 whitespace-nowrap"
        >
          <Globe className="w-4 h-4 mr-1.5" /> Ngôn ngữ
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="mt-6">
        <AccountInfoCard user={user} locale={locale} />
      </TabsContent>

      <TabsContent value="privacy" className="mt-6 space-y-5">
        {profile?.kind === "member" ? (
          <PrivacyCard
            initialVisibility={profile.data.profile_visibility}
            initialOpenToWork={profile.data.open_to_work}
          />
        ) : null}
        {profile?.kind === "company" ? (
          <OpenToHireCard initialValue={profile.data.open_to_hire} />
        ) : null}
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <Card className="rounded-2xl border-border/30 p-6 space-y-1">
          <h2 className="font-headline font-bold text-base text-foreground mb-1">
            Tùy chỉnh thông báo
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Cấu hình kênh thông báo sẽ được kích hoạt khi tính năng được triển
            khai
          </p>
          {NOTIFICATION_PLACEHOLDERS.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3.5 rounded-xl hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.checked} disabled />
            </div>
          ))}
        </Card>
      </TabsContent>

      <TabsContent value="language" className="mt-6">
        <p className="text-sm text-muted-foreground">
          Bạn có thể đổi ngôn ngữ trong tab Tài khoản.
        </p>
      </TabsContent>
    </Tabs>
  )
}
