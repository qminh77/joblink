"use client"

import { useCallback, useEffect } from "react"

type Grecaptcha = {
  ready: (cb: () => void) => void
  execute: (
    siteKey: string,
    opts: { action: string },
  ) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

export type RecaptchaConfig = {
  enabled: boolean
  siteKey: string | null
}

const SCRIPT_ATTR = "data-recaptcha-script"

export function useRecaptcha(config: RecaptchaConfig) {
  const enabled = config.enabled && !!config.siteKey
  const siteKey = config.siteKey

  useEffect(() => {
    if (!enabled || !siteKey) return
    if (
      typeof document === "undefined" ||
      document.querySelector(`script[${SCRIPT_ATTR}]`)
    ) {
      return
    }
    const script = document.createElement("script")
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
    script.async = true
    script.defer = true
    script.setAttribute(SCRIPT_ATTR, "1")
    document.head.appendChild(script)
  }, [enabled, siteKey])

  const getToken = useCallback(
    async (action: string): Promise<string | null> => {
      if (!enabled || !siteKey) return null
      if (typeof window === "undefined") return null
      const grecaptcha = window.grecaptcha
      if (!grecaptcha) {
        // Wait briefly for script to load
        await new Promise((r) => setTimeout(r, 800))
        if (!window.grecaptcha) return null
      }
      return new Promise<string | null>((resolve) => {
        window.grecaptcha!.ready(async () => {
          try {
            const token = await window.grecaptcha!.execute(siteKey, {
              action,
            })
            resolve(token)
          } catch {
            resolve(null)
          }
        })
      })
    },
    [enabled, siteKey],
  )

  return { enabled, getToken }
}
