"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Bell, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useToggleFollowUser } from "../hooks"

type Props = {
  targetUserId: number
  initialIsFollowing: boolean
  initialFollowerCount: number
  disabled?: boolean
  size?: "sm" | "default"
  onStateChange?: (state: {
    isFollowing: boolean
    followerCount: number
  }) => void
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  disabled,
  size = "default",
  onStateChange,
}: Props) {
  const tView = useTranslations("profile.view")
  const tStats = useTranslations("profile.stats")
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const toggle = useToggleFollowUser()

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
    onStateChange?.({
      isFollowing: nextIsFollowing,
      followerCount: nextFollowerCount,
    })

    toggle.mutate(targetUserId, {
      onError: () => {
        setIsFollowing(previousIsFollowing)
        setFollowerCount(previousFollowerCount)
        onStateChange?.({
          isFollowing: previousIsFollowing,
          followerCount: previousFollowerCount,
        })
      },
      onSuccess: (result) => {
        if (!result.ok) return
        setIsFollowing(result.isFollowing)
        setFollowerCount(result.followerCount)
        onStateChange?.({
          isFollowing: result.isFollowing,
          followerCount: result.followerCount,
        })
      },
    })
  }

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "secondary" : "default"}
      disabled={disabled || toggle.isPending}
      onClick={handleClick}
      aria-label={tStats("followers", { count: followerCount })}
    >
      {isFollowing ? <Bell /> : <UserPlus />}
      {isFollowing ? tView("following") : tView("follow")}
    </Button>
  )
}
