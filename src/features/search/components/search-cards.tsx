"use client"

import { MapPin } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"
import type { SearchPageCompany, SearchPageJob, SearchPagePerson, SearchPagePost } from "../types"

export function PeopleCard({
  person,
}: {
  person: SearchPagePerson
}) {
  return (
    <a
      href={profileHref(person.userId, person.role)}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
    >
      <Avatar className="w-12 h-12 shrink-0 border border-border/30">
        {person.avatarUrl ? <AvatarImage src={person.avatarUrl} /> : null}
        <AvatarFallback>{getInitials(person.name, "JL")}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
          {person.name}
        </p>
        {person.headline ? (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {person.headline}
          </p>
        ) : null}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {person.location ? (
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {person.location}
            </span>
          ) : null}
          {person.connectionStatus === "connected" ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
            >
              Connected
            </Badge>
          ) : person.connectionStatus === "pending" ? (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 font-normal text-amber-600 border-amber-300"
            >
              Pending
            </Badge>
          ) : null}
        </div>
      </div>
    </a>
  )
}

export function CompanyCard({
  company,
}: {
  company: SearchPageCompany
}) {
  return (
    <a
      href={profileHref(company.userId, "company")}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
    >
      <Avatar className="w-12 h-12 shrink-0 rounded-xl border border-border/30">
        {company.logoUrl ? <AvatarImage src={company.logoUrl} /> : null}
        <AvatarFallback className="rounded-xl text-lg font-bold text-muted-foreground">
          {company.name?.[0] ?? "C"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
            {company.name}
          </p>
          {company.verified ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
            >
              Verified
            </Badge>
          ) : null}
        </div>
        {company.industry ? (
          <p className="text-xs text-muted-foreground mt-0.5">{company.industry}</p>
        ) : null}
        {company.description ? (
          <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
            {company.description}
          </p>
        ) : null}
      </div>
    </a>
  )
}

export function JobCard({ job }: { job: SearchPageJob }) {
  return (
    <a
      href={`/jobs/${job.id}`}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
    >
      <Avatar className="w-12 h-12 shrink-0 rounded-xl border border-border/30">
        {job.companyLogoUrl ? <AvatarImage src={job.companyLogoUrl} /> : null}
        <AvatarFallback className="rounded-xl text-lg font-bold text-muted-foreground">
          {job.companyName?.[0] ?? "J"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors truncate">
          {job.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {job.companyName}
          {job.companyVerified ? (
            <span className="text-emerald-500 ml-1">✓</span>
          ) : null}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-muted-foreground">
          {job.salaryVisible && job.salaryMin != null ? (
            <span className="font-medium text-foreground/80">
              {job.salaryMin && job.salaryMax
                ? `${(job.salaryMin / 1_000_000).toFixed(0)}-${(job.salaryMax / 1_000_000).toFixed(0)}tr`
                : job.salaryMin
                  ? `From ${(job.salaryMin / 1_000_000).toFixed(0)}tr`
                  : ""}
            </span>
          ) : null}
          {job.provinceName ? (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {job.provinceName}
            </span>
          ) : null}
          {job.jobTypeName ? <span>{job.jobTypeName}</span> : null}
          {job.workModeName ? <span>{job.workModeName}</span> : null}
        </div>
      </div>
    </a>
  )
}

export function PostCard({ post }: { post: SearchPagePost }) {
  const MAX_LENGTH = 250
  const truncated =
    post.content.length > MAX_LENGTH
      ? post.content.slice(0, MAX_LENGTH) + "..."
      : post.content

  return (
    <a
      href={`/posts/${post.id}`}
      className="block p-3 rounded-xl hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="w-6 h-6 shrink-0">
          {post.authorAvatarUrl ? (
            <AvatarImage src={post.authorAvatarUrl} />
          ) : null}
          <AvatarFallback className="text-[10px]">
            {(post.authorName?.[0] ?? "J").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-foreground truncate">
          {post.authorName}
        </span>
      </div>
      <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">
        {truncated}
      </p>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
        <span>{post.reactionCount} reactions</span>
        <span>{post.commentCount} comments</span>
      </div>
    </a>
  )
}
