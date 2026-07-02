"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

import { HIDDEN_ROUTES } from "@/features/messaging/components/messaging-dock/constants"

const RealtimeNotifications = dynamic(
  () =>
    import("@/features/notifications/components/realtime-notifications").then(
      (mod) => mod.RealtimeNotifications,
    ),
  { ssr: false },
)

const RealtimeMessaging = dynamic(
  () =>
    import("@/features/messaging/components/realtime-messaging").then(
      (mod) => mod.RealtimeMessaging,
    ),
  { ssr: false },
)

const MessagingDock = dynamic(
  () =>
    import("@/features/messaging/components/messaging-dock").then(
      (mod) => mod.MessagingDock,
    ),
  { ssr: false },
)

function useDeferredShellReady(delayMs = 1200) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let idleHandle: number | undefined
    const timer = window.setTimeout(() => setReady(true), delayMs)

    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => setReady(true), {
        timeout: delayMs + 800,
      })
    }

    return () => {
      window.clearTimeout(timer)
      if (idleHandle != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleHandle)
      }
    }
  }, [delayMs])

  return ready
}

export function MainClientShell() {
  const pathname = usePathname()
  const ready = useDeferredShellReady()
  const hideDock = HIDDEN_ROUTES.some((route) => pathname?.startsWith(route))

  if (!ready) return null

  return (
    <>
      <RealtimeNotifications />
      <RealtimeMessaging />
      {hideDock ? null : <MessagingDock />}
    </>
  )
}
