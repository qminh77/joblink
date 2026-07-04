"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  deleteCvAction,
  renameCvAction,
  setDefaultCvAction,
} from "../api/manage-actions"
import type { RenameCvInput } from "../schemas"
import { actionMessage, useCvTranslations } from "./shared"

export function useRenameCv() {
  const router = useRouter()
  const t = useCvTranslations()
  return useMutation<void, Error, RenameCvInput>({
    mutationFn: async (input) => {
      const res = await renameCvAction(input)
      if (!res.ok) throw new Error(res.error ?? actionMessage(t, "unknownError"))
    },
    onSuccess: () => {
      toast.success(actionMessage(t, "renameSuccess"))
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteCv() {
  const router = useRouter()
  const t = useCvTranslations()
  return useMutation<void, Error, number>({
    mutationFn: async (cvId) => {
      const res = await deleteCvAction(cvId)
      if (!res.ok) throw new Error(res.error ?? actionMessage(t, "unknownError"))
    },
    onSuccess: () => {
      toast.success(actionMessage(t, "deleteSuccess"))
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSetDefaultCv() {
  const router = useRouter()
  const t = useCvTranslations()
  return useMutation<void, Error, number>({
    mutationFn: async (cvId) => {
      const res = await setDefaultCvAction(cvId)
      if (!res.ok) throw new Error(res.error ?? actionMessage(t, "unknownError"))
    },
    onSuccess: () => {
      toast.success(actionMessage(t, "setDefaultSuccess"))
      router.refresh()
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
