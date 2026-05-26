import { notFound } from "next/navigation"

import { CompanyPublicPage } from "@/features/companies/components/company-public-page"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyUserId = Number(id)
  if (!Number.isInteger(companyUserId) || companyUserId <= 0) notFound()

  return <CompanyPublicPage companyUserId={companyUserId} />
}
