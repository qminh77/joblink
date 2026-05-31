"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  deleteCvAction,
  registerCvAction,
  renameCvAction,
  setDefaultCvAction,
} from "../api/actions"
import {
  CvUploadError,
  uploadCvFile,
  type CvUploadErrorCode,
} from "../lib/upload"
import type { RegisterCvInput, RenameCvInput } from "../schemas"
import type { MemberCv } from "../types"

type UploadVars = {
  file: File
  fileName: string
  userId: number
  makeDefault?: boolean
}

// Wrapper toast + router.refresh chuẩn (giống pattern hooks ở profile/network).
function useTransIcons() {
  return useTranslations("cvs")
}

function actionMessage(t: ReturnType<typeof useTranslations>, key: string) {
  return t(`messages.${key}`)
}

function uploadErrorMessage(
  t: ReturnType<typeof useTranslations>,
  code: CvUploadErrorCode,
) {
  return t(`upload.${code}`)
}

export function useUploadCv() {
  const router = useRouter()
  const t = useTransIcons()
  return useMutation<MemberCv, Error, UploadVars>({
    mutationFn: async ({ file, fileName, userId, makeDefault }) => {
      const { storagePath, fileSize } = await uploadCvFile({ file, userId })
      const input: RegisterCvInput = {
        fileName,
        storagePath,
        fileSize,
        mimeType: "application/pdf",
        makeDefault,
      }
      const res = await registerCvAction(input)
      if (!res.ok) {
        throw new Error(res.error ?? actionMessage(t, "unknownError"))
      }
      return res.data
    },
    onSuccess: () => {
      toast.success(actionMessage(t, "uploadSuccess"))
      router.refresh()
    },
    onError: (err: Error) => {
      if (err instanceof CvUploadError) {
        toast.error(uploadErrorMessage(t, err.code))
        return
      }
      toast.error(err.message)
    },
  })
}

export function useRenameCv() {
  const router = useRouter()
  const t = useTransIcons()
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
  const t = useTransIcons()
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
  const t = useTransIcons()
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
