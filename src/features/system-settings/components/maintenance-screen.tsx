"use client"

import { useTranslations } from "next-intl"
import { Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useLogout } from "@/features/auth/hooks"

// UC-96: màn hình hiển thị cho người dùng thường khi hệ thống đang bảo trì.
// Quản trị viên không bao giờ thấy màn này (được bỏ qua ở (main) layout).
export function MaintenanceScreen({ message }: { message: string | null }) {
  const t = useTranslations("maintenance")
  const logout = useLogout()

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-zinc-50/50 dark:bg-background">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <Wrench className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground font-headline">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground whitespace-pre-line">
            {message ?? t("defaultMessage")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? t("loggingOut") : t("logout")}
        </Button>
      </div>
    </div>
  )
}
