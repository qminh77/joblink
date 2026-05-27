import { notFound } from "next/navigation"

import { CompanyPublicPage } from "@/features/companies/components/company-public-page"
import { loadCompanyPublicOverview } from "@/features/companies/api/queries"
import { loadUserPosts } from "@/features/posts/api/queries"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyUserId = Number(id)
  if (!Number.isInteger(companyUserId) || companyUserId <= 0) notFound()

  const [overview, postsPage] = await Promise.all([
    loadCompanyPublicOverview(companyUserId),
    loadUserPosts(companyUserId),
  ])

  if (!overview) notFound()

  return <CompanyPublicPage overview={overview} postsPage={postsPage} />
}
