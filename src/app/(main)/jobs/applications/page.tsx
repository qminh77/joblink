import { MyApplicationsServerPage } from "@/features/jobs/components/my-applications-page"

export const dynamic = "force-dynamic"

export default async function MyApplicationsRoute() {
  return <MyApplicationsServerPage />
}
