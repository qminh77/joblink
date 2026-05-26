import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

type VerifyResponse = {
  success: boolean
  score?: number
  action?: string
  challenge_ts?: string
  hostname?: string
  "error-codes"?: string[]
}

export type RecaptchaVerifyResult =
  | { ok: true; score: number | null }
  | { ok: false; reason: string }

const SITEVERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
const MIN_SCORE = 0.3

async function loadRecaptchaConfig(): Promise<{
  enabled: boolean
  secret: string | null
}> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("system_settings")
      .select("setting_key, value")
      .in("setting_key", ["recaptcha_enabled", "recaptcha_secret"])
    const map = new Map<string, unknown>()
    for (const row of (data ?? []) as Array<{
      setting_key: string
      value: unknown
    }>) {
      map.set(row.setting_key, row.value)
    }
    return {
      enabled: Boolean(map.get("recaptcha_enabled")),
      secret: (map.get("recaptcha_secret") as string | null) ?? null,
    }
  } catch {
    return { enabled: false, secret: null }
  }
}

export async function verifyRecaptcha(
  token: string | null | undefined,
  expectedAction?: string,
): Promise<RecaptchaVerifyResult> {
  const config = await loadRecaptchaConfig()
  if (!config.enabled || !config.secret) {
    // Feature disabled — treat as success so flow proceeds.
    return { ok: true, score: null }
  }
  if (!token || token.length < 10) {
    return { ok: false, reason: "missing_token" }
  }
  try {
    const body = new URLSearchParams({
      secret: config.secret,
      response: token,
    })
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
    })
    if (!res.ok) {
      return { ok: false, reason: "siteverify_unreachable" }
    }
    const data = (await res.json()) as VerifyResponse
    if (!data.success) {
      return {
        ok: false,
        reason: data["error-codes"]?.[0] ?? "verification_failed",
      }
    }
    if (typeof data.score === "number" && data.score < MIN_SCORE) {
      return { ok: false, reason: "low_score" }
    }
    if (
      expectedAction &&
      data.action &&
      data.action !== expectedAction
    ) {
      return { ok: false, reason: "action_mismatch" }
    }
    return { ok: true, score: data.score ?? null }
  } catch {
    return { ok: false, reason: "verification_failed" }
  }
}
