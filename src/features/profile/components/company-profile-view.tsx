"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  BadgeCheck,
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserSquare,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CompanyFollowButton } from "@/features/companies/components/company-follow-button"
import { ConnectButton } from "@/features/network/components/connect-button"
import { MessageButton } from "@/features/messaging/components/message-button"
import type { ConnectionRelation } from "@/features/network/types"
import type { UserPostsPage } from "@/features/posts/types"
import type { CompanyProfileDetail } from "@/features/profile/types"
import { getInitials } from "@/lib/utils/format"
import { fadeUp, pageEntrance, staggerMd } from "@/lib/animations"

import { ProfilePostsSection } from "./profile-posts-section"
import { SectionCard } from "./section-card"

const VERIFICATION_LABELS: Record<CompanyProfileDetail["verification_status"], { label: string; tone: string }> = {
  pending: { label: "Chờ xác minh", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  pending_update: { label: "Cần cập nhật", tone: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  verified: { label: "Đã xác minh", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  rejected: { label: "Từ chối", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  suspended: { label: "Tạm khóa", tone: "bg-destructive/15 text-destructive border-destructive/30" },
}

export function CompanyProfileView({
  company,
  isOwner,
  relation,
  postsPage,
}: {
  company: CompanyProfileDetail
  isOwner: boolean
  relation: ConnectionRelation
  postsPage: UserPostsPage
}) {
  const tProfile = useTranslations("profile")
  const tCompanies = useTranslations("companies.public")
  const initials = getInitials(company.name, "JL")
  const verification = VERIFICATION_LABELS[company.verification_status]
  const locationText = [company.district?.name, company.province?.name]
    .filter(Boolean)
    .join(", ")

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-5"
    >
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden rounded-2xl border-border/40 p-0 gap-0">
          <div className="h-28 bg-gradient-to-r from-primary/80 to-blue-400" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-4">
                <Avatar className="w-24 h-24 border-4 border-card shadow-sm rounded-2xl -mt-12">
                  {company.logo_url ? <AvatarImage src={company.logo_url} /> : null}
                  <AvatarFallback className="text-lg font-semibold rounded-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground break-words">
                      {company.name}
                    </h1>
                    <Badge className={verification.tone}>
                      <ShieldCheck className="w-3 h-3 mr-1" /> {verification.label}
                    </Badge>
                    {company.open_to_hire ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                        <BadgeCheck className="w-3 h-3 mr-1" /> Đang tuyển dụng
                      </Badge>
                    ) : null}
                  </div>
                  {company.industry ? (
                    <p className="text-sm text-muted-foreground">
                      {company.industry}
                      {company.size ? ` · ${company.size} nhân viên` : ""}
                    </p>
                  ) : null}
                  {locationText ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {locationText}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-2">
                {isOwner ? (
                  <Button asChild className="rounded-lg" size="sm">
                    <Link href="/settings">
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Quản lý hồ sơ
                    </Link>
                  </Button>
                ) : (
                  <>
                    <CompanyFollowButton
                      companyUserId={company.user_id}
                      initialIsFollowing={company.isFollowing}
                      initialFollowerCount={company.followerCount}
                    />
                    <ConnectButton
                      relation={relation}
                      targetUserId={company.user_id}
                      size="sm"
                    />
                    {relation.kind === "accepted" ? (
                      <MessageButton
                        targetUserId={company.user_id}
                        size="sm"
                      />
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {tCompanies("followerCount", { count: company.followerCount })}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {tProfile("stats.connections", {
                  count: company.connectionCount,
                })}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={staggerMd}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
      >
        <div className="lg:col-span-2 space-y-5">
          {company.about ? (
            <motion.div variants={fadeUp}>
              <SectionCard title="Giới thiệu">
                <p className="text-sm text-foreground/90 whitespace-pre-line">
                  {company.about}
                </p>
              </SectionCard>
            </motion.div>
          ) : null}

          <motion.div variants={fadeUp}>
            <ProfilePostsSection
              targetUserId={company.user_id}
              isOwner={isOwner}
              initialPage={postsPage}
            />
          </motion.div>
        </div>

        <motion.div variants={fadeUp}>
          <SectionCard
            title="Thông tin doanh nghiệp"
            icon={<Building2 className="w-4 h-4 text-primary" />}
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-foreground">
                  {company.business_email || company.email}
                </span>
              </div>
              {company.phone ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <a
                    href={`tel:${company.phone}`}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {company.phone}
                  </a>
                </div>
              ) : null}
              {company.website ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:opacity-80 transition-opacity break-all"
                  >
                    {company.website}
                  </a>
                </div>
              ) : null}
              {company.business_address ? (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4 mt-0.5" />
                  <span className="text-foreground/90">
                    {company.business_address}
                  </span>
                </div>
              ) : null}
              {company.representative_name ? (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <UserSquare className="w-4 h-4 mt-0.5" />
                  <span className="text-foreground/90">
                    {company.representative_name}
                    {company.representative_title
                      ? ` · ${company.representative_title}`
                      : ""}
                  </span>
                </div>
              ) : null}
            </div>
          </SectionCard>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
