"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { registerCvAction } from "../api/actions"
import {
  CvUploadError,
  uploadCvFile,
  type CvUploadErrorCode,
} from "../lib/upload"
import type { RegisterCvInput } from "../schemas"
import type { MemberCv } from "../types"
import { actionMessage, useCvTranslations } from "./shared"

type UploadVars = {
  file: File
  fileName: string
  userId: number
  makeDefault?: boolean
}

function uploadErrorMessage(
  t: ReturnType<typeof useTranslations>,
  code: CvUploadErrorCode,
) {
  return t(`upload.${code}`)
}

export function useUploadCv() {
  const router = useRouter()
  const t = useCvTranslations()
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
