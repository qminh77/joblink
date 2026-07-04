"use client"

import { useOptimistic, startTransition, useEffect, useState } from "react"
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
  const toggle = useToggleFollowUser()

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

  const handleClick = () => {
    if (disabled) return
    const nextIsFollowing = !optimisticState.isFollowing

    startTransition(async () => {
      addOptimistic(nextIsFollowing)
      onStateChange?.({
        isFollowing: nextIsFollowing,
        followerCount: Math.max(0, optimisticState.followerCount + (nextIsFollowing ? 1 : -1))
      })

      await toggle.mutateAsync(targetUserId, {
        onSuccess: (result) => {
          if (!result.ok) return
          setServerState({
            isFollowing: result.isFollowing,
            followerCount: result.followerCount,
          })
          onStateChange?.({
            isFollowing: result.isFollowing,
            followerCount: result.followerCount,
          })
        },
      }).catch(() => {})
    })
  }

  return (
    <Button
      type="button"
      size={size}
      variant={optimisticState.isFollowing ? "secondary" : "default"}
      disabled={disabled}
      onClick={handleClick}
      aria-label={tStats("followers", { count: optimisticState.followerCount })}
    >
      {optimisticState.isFollowing ? <Bell /> : <UserPlus />}
      {optimisticState.isFollowing ? tView("following") : tView("follow")}
    </Button>
  )
}
