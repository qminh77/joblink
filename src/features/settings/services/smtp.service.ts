import "server-only"

import nodemailer, { type Transporter } from "nodemailer"

import { createAdminClient } from "@/lib/supabase/admin"

export type SmtpConfig = {
  host: string
  port: number
  username: string | null
  password: string | null
  encryption: "none" | "ssl" | "tls"
  fromEmail: string
  fromName: string
}

export type SmtpSendInput = {
  to: string
  subject: string
  text?: string
  html?: string
}

export type SmtpSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string }

const SMTP_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_username",
  "smtp_password",
  "smtp_encryption",
  "smtp_from_email",
  "smtp_from_name",
]

export async function loadSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_key, value")
      .in("setting_key", SMTP_KEYS)

    if (error) {
      console.error("[SMTP] Lỗi khi đọc cấu hình từ DB:", error.message)
      return null
    }

    const map = new Map<string, unknown>()
    for (const row of (data ?? []) as Array<{
      setting_key: string
      value: unknown
    }>) {
      map.set(row.setting_key, row.value)
    }
    const host = (map.get("smtp_host") as string | null) || null
    const fromEmail = (map.get("smtp_from_email") as string | null) || null
    if (!host || !fromEmail) return null
    const portValue = map.get("smtp_port")
    const port =
      typeof portValue === "number"
        ? portValue
        : portValue
          ? Number(portValue)
          : 587
    const encryptionRaw = (map.get("smtp_encryption") as string) || "tls"
    const encryption = encryptionRaw.toLowerCase() as
      | "none"
      | "ssl"
      | "tls"
    return {
      host,
      port: Number.isFinite(port) ? port : 587,
      username: (map.get("smtp_username") as string | null) || null,
      password: (map.get("smtp_password") as string | null) || null,
      encryption,
      fromEmail,
      fromName: (map.get("smtp_from_name") as string | null) || "Joblink",
    }
  } catch (err) {
    console.error("[SMTP] Lỗi nghiêm trọng khi load config:", err)
    return null
  }
}

function buildTransport(config: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.encryption === "ssl",
    requireTLS: config.encryption === "tls",
    auth:
      config.username && config.password
        ? { user: config.username, pass: config.password }
        : undefined,
  })
}

export async function sendMail(input: SmtpSendInput): Promise<SmtpSendResult> {
  const config = await loadSmtpConfig()
  if (!config) return { ok: false, error: "smtp_not_configured" }
  try {
    const transport = buildTransport(config)
    const info = await transport.sendMail({
      from: { name: config.fromName, address: config.fromEmail },
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    return { ok: true, messageId: info.messageId ?? "" }
  } catch (err) {
    console.error("[SMTP] Lỗi khi gửi mail qua nodemailer:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "send_failed",
    }
  }
}

export async function verifySmtpTransport(): Promise<SmtpSendResult> {
  const config = await loadSmtpConfig()
  if (!config) return { ok: false, error: "smtp_not_configured" }
  try {
    const transport = buildTransport(config)
    await transport.verify()
    return { ok: true, messageId: "" }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "verify_failed",
    }
  }
}
