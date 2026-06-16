"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Ban, Flag, MoreHorizontal, UserCheck } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useBlockStatus, useBlockUser, useUnblockUser } from "../hooks"

// Menu "•••" trên hồ sơ người khác: gộp Báo cáo + Chặn/Bỏ chặn (UC-46/UC-47).
// Báo cáo được uỷ quyền lên cha qua onReport để tái dùng ReportDialog sẵn có.
export function ProfileActionsMenu({
  targetUserId,
  targetName,
  onReport,
}: {
  targetUserId: number
  targetName: string
  onReport: () => void
}) {
  const t = useTranslations("network.block")
  const tProfile = useTranslations("profile")
  const { data: status } = useBlockStatus(targetUserId)
  const block = useBlockUser()
  const unblock = useUnblockUser()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const blocked = status?.blockedByMe ?? false
  const pending = block.isPending || unblock.isPending

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t("menuLabel")}
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 w-8 h-8 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl">
          <DropdownMenuItem
            onClick={onReport}
            className="cursor-pointer rounded-lg"
          >
            <Flag className="w-4 h-4 mr-2 text-muted-foreground" />
            {tProfile("view.reportUser")}
          </DropdownMenuItem>
          {blocked ? (
            <DropdownMenuItem
              onClick={() => unblock.mutate(targetUserId)}
              disabled={pending}
              className="cursor-pointer rounded-lg"
            >
              <UserCheck className="w-4 h-4 mr-2 text-muted-foreground" />
              {t("unblock")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
              className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
            >
              <Ban className="w-4 h-4 mr-2" />
              {t("block")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription", { name: targetName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={block.isPending}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={block.isPending}
              onClick={() => block.mutate(targetUserId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
