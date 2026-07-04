"use client"

import { useEffect, useRef } from "react"

import { logProfileViewAction } from "../api/view-actions"

export function ProfileViewLogger({ targetUserId }: { targetUserId: number }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    logProfileViewAction(targetUserId).catch(() => {
      // im lặng – analytics không nên chặn UX
    })
  }, [targetUserId])

  return null
}
