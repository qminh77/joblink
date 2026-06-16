import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { CurrentUserProvider } from "@/features/auth/components/current-user-provider"
import type { SessionUserSummary } from "@/features/auth/types"
import { RealtimeNotifications } from "@/features/notifications/components/realtime-notifications"
import { RealtimeMessaging } from "@/features/messaging/components/realtime-messaging"
import { MessagingDock } from "@/features/messaging/components/messaging-dock"
import { loadMaintenanceState } from "@/features/system-settings/api/public-settings"
import { MaintenanceScreen } from "@/features/system-settings/components/maintenance-screen"
import { Navbar } from "@/components/navbar"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireCurrentUser()

  // UC-96: chế độ bảo trì tạm ngừng truy cập của người dùng thường; quản trị
  // viên vẫn vào được (để tắt bảo trì). Chỉ đọc setting cho non-admin.
  if (user.appUser.role !== "admin") {
    const maintenance = await loadMaintenanceState()
    if (maintenance.enabled) {
      return <MaintenanceScreen message={maintenance.message} />
    }
  }

  const sessionUser: SessionUserSummary = {
    id: user.appUser.id,
    authId: user.appUser.auth_id,
    email: user.appUser.email,
    role: user.appUser.role,
    status: user.appUser.status,
    displayName: user.profile.displayName,
    avatarUrl: user.profile.avatarUrl,
    coverUrl: user.profile.coverUrl,
    headline: user.profile.headline,
  }

  return (
    <CurrentUserProvider user={sessionUser}>
      <RealtimeNotifications />
      <RealtimeMessaging />
      <div className="min-h-screen bg-zinc-50/50 dark:bg-background font-body text-foreground pt-16">
        <Navbar />
        <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <MessagingDock />
    </CurrentUserProvider>
  )
}
