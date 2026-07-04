"use client"

import { useOptimistic, startTransition, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Bell, Plus } from "lucide-react"

import { useToggleFollowCompany } from "../hooks"

type Props = {
  companyUserId: number
  initialIsFollowing: boolean
  initialFollowerCount: number
  disabled?: boolean
}

/**
 * Toggle follow/unfollow ngay từ trang public của công ty. Optimistic — đổi
 * trạng thái + count trước, rollback khi server lỗi.
 */
export function CompanyFollowButton({
  companyUserId,
  initialIsFollowing,
  initialFollowerCount,
  disabled,
}: Props) {
  const t = useTranslations("companies.public")
  
  const [serverState, setServerState] = useState({
    isFollowing: initialIsFollowing,
    followerCount: initialFollowerCount,
  })

  // Sync with props if they change externally
  useEffect(() => {
    setServerState({
      isFollowing: initialIsFollowing,
      followerCount: initialFollowerCount,
    })
  }, [initialIsFollowing, initialFollowerCount])

  const [optimisticState, addOptimistic] = useOptimistic(
    serverState,
    (state, nextIsFollowing: boolean) => ({
      isFollowing: nextIsFollowing,
      followerCount: Math.max(
        0,
        state.followerCount + (nextIsFollowing ? 1 : -1)
      ),
    })
  )

  const toggle = useToggleFollowCompany()

  const handleClick = () => {
    if (disabled) return
    const nextIsFollowing = !optimisticState.isFollowing

    startTransition(async () => {
      addOptimistic(nextIsFollowing)

      await toggle.mutateAsync(companyUserId, {
        onSuccess: (result) => {
          if (!result.ok) return
          setServerState({
            isFollowing: result.isFollowing,
            followerCount: result.followerCount,
          })
        },
      }).catch(() => {})
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={t("followerCount", { count: optimisticState.followerCount })}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-colors disabled:opacity-50 ${
        optimisticState.isFollowing
          ? "bg-muted text-foreground hover:bg-muted/80"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {optimisticState.isFollowing ? (
        <Bell className="w-3.5 h-3.5" />
      ) : (
        <Plus className="w-3.5 h-3.5" />
      )}
      {optimisticState.isFollowing ? t("following") : t("follow")}
    </button>
  )
}
