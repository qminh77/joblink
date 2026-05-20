"use client"

import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useUpdateOpenToHire } from "@/features/settings/hooks"

export function OpenToHireCard({ initialValue }: { initialValue: boolean }) {
  const mutation = useUpdateOpenToHire()

  return (
    <Card className="rounded-2xl border-border/30 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            Đang tuyển dụng (Open to Hire)
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Khi bật, công ty sẽ hiển thị badge &ldquo;Đang tuyển dụng&rdquo;
            trên trang công ty và trong kết quả tìm kiếm
          </p>
        </div>
        <Switch
          defaultChecked={initialValue}
          disabled={mutation.isPending}
          onCheckedChange={(value) => mutation.mutate(value)}
        />
      </div>
    </Card>
  )
}
