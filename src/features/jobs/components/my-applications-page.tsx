import { notFound } from "next/navigation"

import { requireCurrentUser } from "@/features/auth/api/auth-server"

import { loadMyApplications } from "../api/queries"

import {
  MyApplicationsClient,
  MyApplicationsHeader,
} from "./my-applications-client"

export async function MyApplicationsServerPage() {
  const current = await requireCurrentUser()
  if (current.appUser.account_type !== "member") notFound()

  const page = await loadMyApplications({ limit: 30, offset: 0 })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <MyApplicationsHeader />
      <MyApplicationsClient items={page.items} />
    </div>
  )
}
