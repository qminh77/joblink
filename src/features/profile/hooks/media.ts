"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  MESSAGING_OVERVIEW_KEY,
} from "@/features/messaging/hooks"
import { NETWORK_OVERVIEW_KEY } from "@/features/network/hooks"
import { NOTIFICATIONS_KEY } from "@/features/notifications/hooks"
import {
  FEED_QUERY_KEY,
  HOME_STATS_KEY,
  USER_POSTS_QUERY_KEY,
} from "@/features/posts/hooks"

import { updateCompanyMediaAction } from "../api/company-actions"
import { updateMemberMediaAction } from "../api/member-actions"
import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_IMAGE_MAX_BYTES,
  ProfileImageError,
  uploadCompanyImage,
  uploadMemberImage,
  type CropRect,
  type ProfileImageErrorCode,
  type ProfileImageKind,
} from "../lib/media"

type UploadProfileImageArgs = {
  file: File
  crop: CropRect
  kind: ProfileImageKind
}

export const PROFILE_IMAGE_ACCEPT = PROFILE_IMAGE_ALLOWED_TYPES.join(",")

export function getProfileImageErrorMessage(
  code: ProfileImageErrorCode,
): string {
  switch (code) {
    case "tooLarge":
      return `Ảnh vượt quá ${Math.round(PROFILE_IMAGE_MAX_BYTES / 1024 / 1024)} MB`
    case "invalidType":
      return "Định dạng không hỗ trợ (chỉ JPG, PNG, GIF, WEBP)"
    case "unauthorized":
      return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"
    default:
      return "Không thể tải ảnh lên, vui lòng thử lại"
  }
}

export function useMemberProfileImageUpload(userId: number) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const uploadImage = useCallback(
    async ({ file, crop, kind }: UploadProfileImageArgs): Promise<boolean> => {
      setBusy(true)
      try {
        const url = await uploadMemberImage({ file, crop, kind, userId })
        const result = await updateMemberMediaAction(
          kind === "avatar" ? { avatarUrl: url } : { coverUrl: url },
        )
        if (!result.ok) throw new Error(result.error)

        toast.success(
          kind === "avatar"
            ? "Đã cập nhật ảnh đại diện"
            : "Đã cập nhật ảnh bìa",
        )

        if (kind === "avatar") {
          invalidateMemberAvatarCaches(queryClient, userId)
        }
        router.refresh()
        return true
      } catch (err) {
        toast.error(resolveProfileImageErrorMessage(err))
        return false
      } finally {
        setBusy(false)
      }
    },
    [queryClient, router, userId],
  )

  return { busy, uploadImage }
}

export function useCompanyProfileImageUpload(userId: number) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const uploadImage = useCallback(
    async ({ file, crop, kind }: UploadProfileImageArgs): Promise<boolean> => {
      setBusy(true)
      try {
        const url = await uploadCompanyImage({ file, crop, kind, userId })
        const result = await updateCompanyMediaAction(
          kind === "avatar" ? { logoUrl: url } : { coverUrl: url },
        )
        if (!result.ok) throw new Error(result.error)

        toast.success(
          kind === "avatar" ? "Đã cập nhật logo công ty" : "Đã cập nhật ảnh bìa",
        )
        router.refresh()
        return true
      } catch (err) {
        toast.error(resolveProfileImageErrorMessage(err))
        return false
      } finally {
        setBusy(false)
      }
    },
    [router, userId],
  )

  return { busy, uploadImage }
}

function resolveProfileImageErrorMessage(err: unknown) {
  if (err instanceof ProfileImageError) {
    return getProfileImageErrorMessage(err.code)
  }
  if (err instanceof Error) return err.message
  return "Không thể tải ảnh lên"
}

function invalidateMemberAvatarCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number,
) {
  queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY })
  queryClient.invalidateQueries({ queryKey: USER_POSTS_QUERY_KEY(userId) })
  queryClient.invalidateQueries({ queryKey: HOME_STATS_KEY })
  queryClient.invalidateQueries({ queryKey: NETWORK_OVERVIEW_KEY })
  queryClient.invalidateQueries({ queryKey: MESSAGING_OVERVIEW_KEY })
  queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
}
