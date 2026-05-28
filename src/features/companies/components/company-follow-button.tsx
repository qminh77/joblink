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

  const toggle = useToggleFollowCompany({
    onRollback: () => {
      // Rollback exactly the optimistic change we did in onClick.
      setIsFollowing((prev) => !prev)
      setFollowerCount((prev) =>
        Math.max(0, prev + (isFollowing ? 1 : -1)),
      )
    },
  })

  const handleClick = () => {
    if (toggle.isPending || disabled) return

    // Optimistic update — server result sẽ ghi đè để chính xác lại
    // (trường hợp count khác do follow đồng thời từ thiết bị khác).
    setIsFollowing((prev) => !prev)
    setFollowerCount((prev) =>
      Math.max(0, prev + (isFollowing ? -1 : 1)),
    )

    toggle.mutate(companyUserId, {
      onSuccess: (result) => {
        if (!result.ok) return
        setIsFollowing(result.isFollowing)
        setFollowerCount(result.followerCount)
      },
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || toggle.isPending}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-8 rounded-lg transition-colors disabled:opacity-50 ${
          isFollowing
            ? "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            : "text-primary hover:bg-primary/10"
        }`}
      >
        {isFollowing ? (
          <Bell className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {isFollowing ? t("following") : t("follow")}
      </button>
      <span className="text-[11px] text-muted-foreground">
        {t("followerCount", { count: followerCount })}
      </span>
    </div>
  )
}
