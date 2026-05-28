"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { PROFILE_VISIBILITIES } from "@/features/profile/lib/constants"
import { useUpdatePrivacy } from "@/features/settings/hooks"
import type { ProfileVisibility } from "@/types/database"

export function PrivacyCard({
  initialVisibility,
  initialOpenToWork,
}: {
  initialVisibility: ProfileVisibility
  initialOpenToWork: boolean
}) {
  const t = useTranslations("settings.privacy")
  const tCommon = useTranslations("common")
  const tVis = useTranslations("profile.visibility")
  const [visibility, setVisibility] =
    useState<ProfileVisibility>(initialVisibility)
  const [openToWork, setOpenToWork] = useState(initialOpenToWork)
  const updatePrivacy = useUpdatePrivacy()

  const dirty =
    visibility !== initialVisibility || openToWork !== initialOpenToWork

  function save() {
    updatePrivacy.mutate({
      profileVisibility: visibility,
      openToWork,
    })
  }

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-5">
      <div>
        <h2 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{t("visibility")}</p>
          <p className="text-xs text-muted-foreground">{t("visibilityHint")}</p>
        </div>
        <Select
          value={visibility}
          onValueChange={(value) => setVisibility(value as ProfileVisibility)}
        >
          <SelectTrigger className="h-10 rounded-xl w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_VISIBILITIES.map((value) => (
              <SelectItem key={value} value={value}>
                {tVis(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">{t("openToWork")}</p>
          <p className="text-xs text-muted-foreground">{t("openToWorkHint")}</p>
        </div>
        <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || updatePrivacy.isPending}
          className="inline-flex items-center text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
        >
          {updatePrivacy.isPending ? tCommon("saving") : tCommon("saveChanges")}
        </button>
      </div>
    </Card>
  )
}
