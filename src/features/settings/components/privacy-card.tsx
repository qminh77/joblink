"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  PROFILE_VISIBILITIES,
  PROFILE_VISIBILITY_LABELS,
} from "@/features/profile/lib/constants"
import { useUpdatePrivacy } from "@/features/settings/hooks"
import type { ProfileVisibility } from "@/types/database"

export function PrivacyCard({
  initialVisibility,
  initialOpenToWork,
}: {
  initialVisibility: ProfileVisibility
  initialOpenToWork: boolean
}) {
  const [visibility, setVisibility] =
    useState<ProfileVisibility>(initialVisibility)
  const [openToWork, setOpenToWork] = useState(initialOpenToWork)
  const updatePrivacy = useUpdatePrivacy()

  const dirty =
    visibility !== initialVisibility || openToWork !== initialOpenToWork

  function save() {
    updatePrivacy.mutate({
      profileVisibility: visibility,
      openToWork,
    })
  }

  return (
    <Card className="rounded-2xl border-border/30 p-6 space-y-5">
      <div>
        <h2 className="font-headline font-bold text-base text-foreground">
          Quyền riêng tư hồ sơ
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Quyết định ai có thể xem hồ sơ và các thông tin nghề nghiệp của bạn
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Mức hiển thị hồ sơ
          </p>
          <p className="text-xs text-muted-foreground">
            Public: ai cũng xem được · Connections: chỉ người đã kết nối ·
            Private: chỉ chính bạn
          </p>
        </div>
        <Select
          value={visibility}
          onValueChange={(value) => setVisibility(value as ProfileVisibility)}
        >
          <SelectTrigger className="h-10 rounded-xl w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_VISIBILITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {PROFILE_VISIBILITY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Đang tìm việc (Open to Work)
          </p>
          <p className="text-xs text-muted-foreground">
            Hiển thị badge xanh trên hồ sơ và cho phép nhà tuyển dụng lọc bạn
            theo trạng thái này
          </p>
        </div>
        <Switch
          checked={openToWork}
          onCheckedChange={setOpenToWork}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={!dirty || updatePrivacy.isPending}
          className="rounded-lg"
        >
          {updatePrivacy.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </Card>
  )
}
