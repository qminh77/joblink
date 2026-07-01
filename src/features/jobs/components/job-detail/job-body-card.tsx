"use client"

import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"

import type { JobDetail } from "../../types"

type JobBodyCardProps = {
  detail: JobDetail
}

export function JobBodyCard({ detail }: JobBodyCardProps) {
  const t = useTranslations("jobs.public")
  const { job, skills } = detail

  return (
    <Card className="bg-card rounded-2xl p-6 lg:p-8 space-y-8">
      <div>
        <h2 className="font-headline text-lg font-bold text-foreground mb-3">
          {t("description")}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {job.description}
        </p>
      </div>

      {job.requirements ? (
        <div>
          <h2 className="font-headline text-lg font-bold text-foreground mb-3">
            {t("requirements")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {job.requirements}
          </p>
        </div>
      ) : null}

      {skills.length > 0 ? (
        <div>
          <h2 className="font-headline text-lg font-bold text-foreground mb-3">
            {t("requiredSkills")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-3 h-7 rounded-full text-xs font-medium bg-muted text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
