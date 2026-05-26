"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  sendMail,
  verifySmtpTransport,
} from "@/features/system-settings/api/smtp"

import { requireAdmin } from "./admin-guard"
import { writeAuditLog } from "./audit-log"
import {
  ALLOWED_SETTING_KEYS,
  SETTING_GROUPS,
} from "../lib/setting-groups"
import { settingsUpdateSchema, type SettingsUpdateInput } from "../schemas"
import type { AdminSettingsMap, AdminSettingsValue } from "../types"

export async function loadSystemSettings(): Promise<{
  values: AdminSettingsMap
  groups: typeof SETTING_GROUPS
}> {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("system_settings")
    .select("setting_key, value")

  const values: AdminSettingsMap = {}
  for (const row of (data ?? []) as Array<{
    setting_key: string
    value: AdminSettingsValue
  }>) {
    values[row.setting_key] = row.value
  }
  return { values, groups: SETTING_GROUPS }
}

export async function updateSystemSettings(
  input: SettingsUpdateInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = settingsUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "invalid_input" }
  const current = await requireAdmin()
  const supabase = createAdminClient()

  const changes: { key: string; value: AdminSettingsValue }[] = []
  for (const [key, value] of Object.entries(parsed.data)) {
    if (ALLOWED_SETTING_KEYS.has(key)) {
      changes.push({ key, value: value as AdminSettingsValue })
    }
  }
  if (changes.length === 0) return { ok: true }

  for (const change of changes) {
    await supabase
      .from("system_settings")
      .update({
        value: change.value as never,
        updated_by: current.appUser.id,
      })
      .eq("setting_key", change.key)
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "settings.update",
    entityType: "system_settings",
    newData: Object.fromEntries(changes.map((c) => [c.key, c.value])),
  })

  revalidatePath("/admin/settings")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}

export type SmtpTestResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string }

export async function testSmtpConnection(): Promise<SmtpTestResult> {
  await requireAdmin()
  const result = await verifySmtpTransport()
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true, messageId: result.messageId }
}

export async function sendTestEmail(
  toEmail: string,
): Promise<SmtpTestResult> {
  const current = await requireAdmin()
  const target = (toEmail ?? "").trim() || current.appUser.email
  if (!target) return { ok: false, error: "missing_recipient" }

  const result = await sendMail({
    to: target,
    subject: "[Joblink] Kiểm tra cấu hình SMTP",
    text: `Xin chào,\n\nĐây là email kiểm tra cấu hình SMTP cho Joblink. Nếu bạn nhận được email này, SMTP đã hoạt động.\n\nThời gian: ${new Date().toISOString()}`,
    html: `<p>Xin chào,</p><p>Đây là email kiểm tra cấu hình SMTP cho <strong>Joblink</strong>. Nếu bạn nhận được email này, SMTP đã hoạt động.</p><p style="color:#666">Thời gian: ${new Date().toISOString()}</p>`,
  })
  if (!result.ok) return { ok: false, error: result.error }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "settings.smtp_test",
    entityType: "system_settings",
    newData: { to: target },
  })

  revalidatePath("/admin/audit-log")
  return { ok: true, messageId: result.messageId }
}
