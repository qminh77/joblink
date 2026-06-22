import { MyApplicationsServerPage } from "@/features/jobs/components/my-applications-page"
import { requirePermission } from "@/lib/rbac"

export const dynamic = "force-dynamic"

export default async function MyApplicationsRoute() {
  await requirePermission("jobs.apply")
  return <MyApplicationsServerPage />
}
