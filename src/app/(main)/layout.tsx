import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { CurrentUserProvider } from "@/features/auth/components/current-user-provider"
import type { SessionUserSummary } from "@/features/auth/types"
import { getAdminEntryHref } from "@/features/admin/lib/admin-navigation"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MainClientShell } from "./main-client-shell"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireCurrentUser()
  const adminHref = getAdminEntryHref(user.appUser.role)

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
    companyVerificationStatus: user.profile.companyVerificationStatus,
    adminHref,
  }

  return (
    <CurrentUserProvider user={sessionUser}>
      <div className="min-h-screen bg-zinc-50/50 dark:bg-background font-body text-foreground pt-16 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 pb-24 md:pb-6 w-full">
          {children}
        </main>
        <Footer />
      </div>
      <MainClientShell />
    </CurrentUserProvider>
  )
}
