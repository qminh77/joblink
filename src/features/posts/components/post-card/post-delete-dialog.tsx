"use client"

import { useTranslations } from "next-intl"

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

export function PostDeleteDialog({
  deleting,
  onConfirm,
  onOpenChange,
  open,
}: {
  deleting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const tPosts = useTranslations("posts")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tPosts("deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tPosts("deleteDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {tPosts("deleteDialog.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction disabled={deleting} onClick={onConfirm}>
            {tPosts("deleteDialog.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
