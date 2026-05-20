import Link from "next/link"
import {
  BadgeCheck,
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  ShieldCheck,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { CompanyProfileDetail } from "@/features/profile/types"
import { getInitials } from "@/lib/utils/format"

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
}: {
  company: CompanyProfileDetail
  isOwner: boolean
}) {
  const initials = getInitials(company.name, "JL")
  const verification = VERIFICATION_LABELS[company.verification_status]
  const locationText = [company.district?.name, company.province?.name]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Card className="overflow-hidden rounded-2xl border-border/40">
        <div className="h-28 bg-gradient-to-r from-primary/80 to-blue-400" />
        <div className="p-6 -mt-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-4">
              <Avatar className="w-24 h-24 border-4 border-card shadow-sm rounded-2xl">
                {company.logo_url ? <AvatarImage src={company.logo_url} /> : null}
                <AvatarFallback className="text-lg font-semibold rounded-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="pb-2 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline font-bold text-2xl text-foreground">
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

            <div className="pb-2 flex gap-2">
              {isOwner ? (
                <Button asChild className="rounded-lg" size="sm">
                  <Link href="/settings">
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Quản lý hồ sơ
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {company.about ? (
            <Card className="rounded-2xl border-border/40 p-5">
              <h2 className="font-headline font-bold text-base text-foreground mb-3">
                Giới thiệu
              </h2>
              <p className="text-sm text-foreground/90 whitespace-pre-line">
                {company.about}
              </p>
            </Card>
          ) : null}
        </div>

        <Card className="rounded-2xl border-border/40 p-5 h-fit space-y-3 text-sm">
          <h2 className="font-headline font-bold text-base text-foreground">
            Thông tin doanh nghiệp
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="text-foreground">
              {company.business_email || company.email}
            </span>
          </div>
          {company.website ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline break-all"
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
        </Card>
      </div>
    </div>
  )
}
