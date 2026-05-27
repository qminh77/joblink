"use client"

import { useEffect, useRef } from "react"

import { logJobViewAction } from "../api/actions"

export function JobViewLogger({ jobId }: { jobId: number }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    logJobViewAction(jobId).catch(() => {
      // im lặng – analytics không nên chặn UX
    })
  }, [jobId])

  return null
}
