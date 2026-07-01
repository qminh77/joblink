"use client"

import { useState } from "react"
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
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)

  const toggle = useToggleFollowCompany()

  const handleClick = () => {
    if (toggle.isPending || disabled) return

    const previousIsFollowing = isFollowing
    const previousFollowerCount = followerCount
    const nextIsFollowing = !previousIsFollowing
    const nextFollowerCount = Math.max(
      0,
      previousFollowerCount + (nextIsFollowing ? 1 : -1),
    )

    setIsFollowing(nextIsFollowing)
    setFollowerCount(nextFollowerCount)

    toggle.mutate(companyUserId, {
      onError: () => {
        setIsFollowing(previousIsFollowing)
        setFollowerCount(previousFollowerCount)
      },
      onSuccess: (result) => {
        if (!result.ok) return
        setIsFollowing(result.isFollowing)
        setFollowerCount(result.followerCount)
      },
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || toggle.isPending}
      aria-label={t("followerCount", { count: followerCount })}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-muted text-foreground hover:bg-muted/80"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      }`}
    >
      {isFollowing ? (
        <Bell className="w-3.5 h-3.5" />
      ) : (
        <Plus className="w-3.5 h-3.5" />
      )}
      {isFollowing ? t("following") : t("follow")}
    </button>
  )
}
