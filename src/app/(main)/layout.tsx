import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { CurrentUserProvider } from "@/features/auth/components/current-user-provider"
import type { SessionUserSummary } from "@/features/auth/types"
import { getAdminUserPermissions } from "@/features/admin/api/admin-guard"
import { getAdminEntryHref } from "@/features/admin/lib/admin-navigation"
import { RealtimeNotifications } from "@/features/notifications/components/realtime-notifications"
import { RealtimeMessaging } from "@/features/messaging/components/realtime-messaging"
import { MessagingDock } from "@/features/messaging/components/messaging-dock"
import { loadMaintenanceState } from "@/features/system-settings/api/public-settings"
import { MaintenanceScreen } from "@/features/system-settings/components/maintenance-screen"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireCurrentUser()
  const permissions = await getAdminUserPermissions()
  const adminHref = getAdminEntryHref(permissions)

  // UC-96: chế độ bảo trì tạm ngừng truy cập của người dùng thường; tài khoản
  // có quyền admin vẫn vào được khu quản trị để xử lý hệ thống.
  if (!adminHref) {
    const maintenance = await loadMaintenanceState()
    if (maintenance.enabled) {
      return <MaintenanceScreen message={maintenance.message} />
    }
  }

  const sessionUser: SessionUserSummary = {
    id: user.appUser.id,
    authId: user.appUser.auth_id,
    email: user.appUser.email,
    role: user.appUser.account_type,
    status: user.appUser.status,
    displayName: user.profile.displayName,
    avatarUrl: user.profile.avatarUrl,
    coverUrl: user.profile.coverUrl,
    headline: user.profile.headline,
    companyVerificationStatus: user.profile.companyVerificationStatus,
    permissions,
    adminHref,
  }

  return (
    <CurrentUserProvider user={sessionUser}>
      <RealtimeNotifications />
      <RealtimeMessaging />
      <div className="min-h-screen bg-zinc-50/50 dark:bg-background font-body text-foreground pt-16 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-6 w-full">
          {children}
        </main>
        <Footer />
      </div>
      <MessagingDock />
    </CurrentUserProvider>
  )
}
