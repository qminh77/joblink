"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import {
  BadgeCheck,
  Briefcase,
  Flag,
  GraduationCap,
  Eye,
  Globe,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Users,
  Wrench,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ConnectButton } from "@/features/network/components/connect-button"
import { MessageButton } from "@/features/messaging/components/message-button"
import { ReportDialog } from "@/features/reports/components/report-dialog"
import type { ConnectionRelation } from "@/features/network/types"
import type { UserPostsPage } from "@/features/posts/types"
import { PROFILE_VISIBILITY_LABELS } from "@/features/profile/lib/constants"
import type { MemberProfileDetail } from "@/features/profile/types"
import { formatDate } from "@/lib/utils/format"
import { getInitials } from "@/lib/utils/format"
import { fadeUp, pageEntrance, staggerMd } from "@/lib/animations"
import { useTranslations } from "next-intl"

import { ProfilePostsSection } from "./profile-posts-section"
import { ProfileViewLogger } from "./profile-view-logger"
import { SectionCard } from "./section-card"

export function MemberProfileView({
  profile,
  relation,
  postsPage,
}: {
  profile: MemberProfileDetail
  relation: ConnectionRelation
  postsPage: UserPostsPage
}) {
  const tProfile = useTranslations("profile")
  const [showReport, setShowReport] = useState(false)
  const initials = getInitials(profile.full_name, "JL")
  const visibilityLabel = PROFILE_VISIBILITY_LABELS[profile.profile_visibility]
  const locationText = [profile.ward?.name, profile.province?.name]
    .filter(Boolean)
    .join(", ")

  if (!profile.isVisible) {
    return (
      <motion.div
        variants={pageEntrance}
        initial="hidden"
        animate="show"
      >
        <Card className="max-w-2xl mx-auto p-10 text-center rounded-2xl bg-card border-border/40">
          <Lock className="w-10 h-10 text-muted-foreground/60 mx-auto mb-4" />
          <h2 className="font-headline font-bold text-lg text-foreground">
            {tProfile("view.privateTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tProfile("view.privateDescription")}
          </p>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={pageEntrance}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-5"
    >
      {!profile.isOwner ? (
        <ProfileViewLogger targetUserId={profile.user_id} />
      ) : null}

      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden rounded-2xl bg-card border-border/40 p-0 gap-0">
          {profile.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.cover_url}
              alt=""
              className="w-full h-36 sm:h-44 object-cover bg-muted"
            />
          ) : (
            <div className="h-28 bg-gradient-to-r from-primary/80 to-blue-400" />
          )}
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex items-end gap-4">
                <Avatar className="w-24 h-24 border-4 border-card -mt-12">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} />
                  ) : null}
                  <AvatarFallback className="text-lg font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline font-bold text-xl sm:text-2xl text-foreground break-words">
                      {profile.full_name}
                    </h1>
                    {profile.open_to_work ? (
                      <Badge
                        variant="outline"
                        className="border-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                      >
                        <BadgeCheck className="w-3 h-3 mr-1" /> {tProfile("view.openToWork")}
                      </Badge>
                    ) : null}
                  </div>
                  {profile.headline ? (
                    <p className="text-sm text-muted-foreground">
                      {profile.headline}
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
                {profile.isOwner ? (
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> {tProfile("view.editProfile")}
                  </Link>
                ) : (
                  <>
                    <ConnectButton
                      relation={relation}
                      targetUserId={profile.user_id}
                      size="sm"
                    />
                    {relation.kind === "accepted" ? (
                      <MessageButton
                        targetUserId={profile.user_id}
                        size="sm"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowReport(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive px-3 h-8 rounded-lg transition-colors"
                      title={tProfile("view.reportUser")}
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {tProfile("stats.connections", {
                  count: profile.connectionCount,
                })}
              </span>
              {profile.isOwner ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {tProfile("view.viewCount", {
                      count: profile.profileViewCount,
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {profile.profile_visibility === "public" ? (
                      <Globe className="w-3.5 h-3.5" />
                    ) : profile.profile_visibility === "connections" ? (
                      <Users className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    {visibilityLabel}
                  </span>
                </>
              ) : null}
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
          {profile.about ? (
            <motion.div variants={fadeUp}>
              <SectionCard title={tProfile("view.about")}>
                <p className="text-sm text-foreground/90 whitespace-pre-line">
                  {profile.about}
                </p>
              </SectionCard>
            </motion.div>
          ) : null}

          <motion.div variants={fadeUp}>
            <SectionCard
              title={tProfile("view.experiences")}
              icon={<Briefcase className="w-4 h-4 text-muted-foreground" />}
              emptyMessage={tProfile("view.experiencesEmpty")}
              empty={profile.experiences.length === 0}
            >
              <ul className="space-y-5">
                {profile.experiences.map((exp) => (
                  <li key={exp.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-foreground">
                        {exp.position}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {exp.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(exp.start_date)} —{" "}
                        {exp.is_current
                          ? tProfile("view.currentPosition")
                          : exp.end_date
                            ? formatDate(exp.end_date)
                            : "—"}
                      </p>
                      {exp.description ? (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 whitespace-pre-line">
                          {exp.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <SectionCard
              title={tProfile("view.educations")}
              icon={<GraduationCap className="w-4 h-4 text-muted-foreground" />}
              emptyMessage={tProfile("view.educationsEmpty")}
              empty={profile.educations.length === 0}
            >
              <ul className="space-y-5">
                {profile.educations.map((edu) => (
                  <li key={edu.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-foreground">
                        {edu.school_name}
                      </h3>
                      {edu.degree || edu.field_of_study ? (
                        <p className="text-sm text-muted-foreground">
                          {[edu.degree, edu.field_of_study]
                            .filter(Boolean)
                            .join(" — ")}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {edu.start_date ? formatDate(edu.start_date) : "—"} —{" "}
                        {edu.end_date ? formatDate(edu.end_date) : "—"}
                      </p>
                      {edu.description ? (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-2 whitespace-pre-line">
                          {edu.description}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ProfilePostsSection
              targetUserId={profile.user_id}
              isOwner={profile.isOwner}
              initialPage={postsPage}
            />
          </motion.div>
        </div>

        <div className="space-y-5">
          <motion.div variants={fadeUp}>
            <SectionCard
              title={tProfile("view.skillsTitle")}
              icon={<Wrench className="w-4 h-4 text-muted-foreground" />}
              empty={profile.skills.length === 0}
              emptyMessage={tProfile("view.skillsEmpty")}
            >
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </SectionCard>
          </motion.div>

          {profile.isOwner ? (
            <motion.div variants={fadeUp}>
              <SectionCard title={tProfile("view.contactPrivate")}>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-foreground">{profile.email}</span>
                  </div>
                  {profile.website ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:opacity-80 transition-opacity truncate"
                      >
                        {profile.website}
                      </a>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            </motion.div>
          ) : profile.website ? (
            <motion.div variants={fadeUp}>
              <SectionCard title={tProfile("view.website")}>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:opacity-80 transition-opacity break-all"
                >
                  {profile.website}
                </a>
              </SectionCard>
            </motion.div>
          ) : null}
        </div>
      </motion.div>

      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="user"
        targetId={profile.user_id}
      />
    </motion.div>
  )
}