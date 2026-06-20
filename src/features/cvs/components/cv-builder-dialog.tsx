"use client"

import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Dialog, DialogContent } from "@/components/ui/dialog"

import { getProfileForCvBuilderAction } from "../api/actions"
import { BuilderForm } from "./cv-builder-dialog/builder-form"
import type { ProfileData } from "./cv-builder-dialog/types"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CvBuilderDialog({ open, onOpenChange }: Props) {
  const t = useTranslations("cvs")
  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["cvs", "builder-profile"],
    enabled: open,
    queryFn: async () => {
      const result = await getProfileForCvBuilderAction()
      if (!result.ok) throw new Error("load_failed")
      return result.data
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl sm:max-w-lg"
        showCloseButton={false}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <BuilderForm data={data} onClose={() => onOpenChange(false)} />
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t("builderDialog.loadError")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
