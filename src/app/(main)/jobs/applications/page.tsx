import { MyApplicationsServerPage } from "@/features/jobs/components/my-applications-page"
import { requireUserRole } from "@/features/auth/api/auth-server"

export const dynamic = "force-dynamic"

export default async function MyApplicationsRoute() {
  await requireUserRole("member")
  return <MyApplicationsServerPage />
}
