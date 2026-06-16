import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail } from "@/features/system-settings/api/smtp"
import { loadPublicAuthSettings } from "@/features/system-settings/api/public-settings"

// ⚠️ Email xác thực gửi qua SMTP của Admin Settings — KHÔNG dùng email built-in
// của Supabase. Cách làm: admin.generateLink() chỉ TẠO link (không tự gửi), sau
// đó tự soạn + gửi bằng sendMail(). Vì không gọi các hàm client tự-gửi
// (resetPasswordForEmail/signUp/updateUser email) nên Supabase không gửi trùng.

export type AuthMailLocale = "vi" | "en"

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}

async function siteName(): Promise<string> {
  try {
    const settings = await loadPublicAuthSettings()
    return settings.site.name || "Joblink"
  } catch {
    return "Joblink"
  }
}

// Khung email HTML tối giản, an toàn với hầu hết mail client (inline style).
function renderEmail(opts: {
  site: string
  heading: string
  intro: string
  buttonLabel: string
  link: string
  hint: string
}): { html: string; text: string } {
  const { site, heading, intro, buttonLabel, link, hint } = opts
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f7;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#2563eb;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold">${site}</div>
    <div style="padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${heading}</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#374151">${intro}</p>
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px">${buttonLabel}</a>
      <p style="font-size:12px;line-height:1.6;margin:20px 0 0;color:#6b7280">${hint}</p>
      <p style="font-size:12px;line-height:1.6;margin:12px 0 0;color:#9ca3af;word-break:break-all">${link}</p>
    </div>
  </div>
</body></html>`
  const text = `${heading}\n\n${intro}\n\n${buttonLabel}: ${link}\n\n${hint}`
  return { html, text }
}

type RecoveryStrings = {
  subject: string
  heading: string
  intro: string
  button: string
  hint: string
}

function recoveryStrings(site: string, locale: AuthMailLocale): RecoveryStrings {
  if (locale === "en") {
    return {
      subject: `Reset your ${site} password`,
      heading: "Reset your password",
      intro: `We received a request to reset the password for your ${site} account. Click the button below to choose a new password.`,
      button: "Reset password",
      hint: "If you didn't request this, you can safely ignore this email. This link expires after a short time.",
    }
  }
  return {
    subject: `Đặt lại mật khẩu ${site}`,
    heading: "Đặt lại mật khẩu",
    intro: `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${site} của bạn. Nhấn nút bên dưới để chọn mật khẩu mới.`,
    button: "Đặt lại mật khẩu",
    hint: "Nếu bạn không yêu cầu, hãy bỏ qua email này. Liên kết sẽ hết hạn sau một thời gian ngắn.",
  }
}

// Gửi email đặt lại mật khẩu (quên mật khẩu). Trả false nếu không tạo được link
// (vd email không tồn tại) hoặc gửi lỗi — caller KHÔNG nên lộ chi tiết ra ngoài.
export async function sendPasswordResetEmail(
  email: string,
  locale: AuthMailLocale = "vi",
): Promise<boolean> {
  const admin = createAdminClient()
  const redirectTo = `${siteUrl()}/auth/callback?next=/settings`

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  })
  const link = data?.properties?.action_link
  if (error || !link) {
    if (error) console.error("[auth-mailer] generateLink recovery", error.message)
    return false
  }

  const site = await siteName()
  const s = recoveryStrings(site, locale)
  const { html, text } = renderEmail({
    site,
    heading: s.heading,
    intro: s.intro,
    buttonLabel: s.button,
    link,
    hint: s.hint,
  })
  const res = await sendMail({ to: email, subject: s.subject, html, text })
  if (!res.ok) console.error("[auth-mailer] sendMail recovery", res.error)
  return res.ok
}

function verifyStrings(site: string, locale: AuthMailLocale): RecoveryStrings {
  if (locale === "en") {
    return {
      subject: `Verify your ${site} email`,
      heading: "Verify your email",
      intro: `Thanks for signing up for ${site}. Click the button below to verify your email and activate your account.`,
      button: "Verify email",
      hint: "If you didn't create this account, you can safely ignore this email.",
    }
  }
  return {
    subject: `Xác minh email ${site}`,
    heading: "Xác minh email",
    intro: `Cảm ơn bạn đã đăng ký ${site}. Nhấn nút bên dưới để xác minh email và kích hoạt tài khoản.`,
    button: "Xác minh email",
    hint: "Nếu bạn không tạo tài khoản này, hãy bỏ qua email.",
  }
}

// Tạo tài khoản (chưa xác minh) bằng admin.generateLink('signup') — KHÔNG tự gửi
// — rồi gửi email xác minh qua SMTP. Trigger handle_new_user tự tạo
// public.users + profile theo data.role. Trả authId để caller (company) cập nhật
// hồ sơ. Email trùng → ok:false kèm code.
export async function createUserAndSendVerification(input: {
  email: string
  password: string
  data: Record<string, unknown>
  locale?: AuthMailLocale
}): Promise<{ ok: true; authId: string } | { ok: false; code: string }> {
  const admin = createAdminClient()
  const redirectTo = `${siteUrl()}/auth/callback?next=/home`

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: input.email,
    password: input.password,
    options: { data: input.data, redirectTo },
  })
  const link = data?.properties?.action_link
  if (error || !link || !data?.user) {
    return { ok: false, code: error?.code || "signup_failed" }
  }

  const site = await siteName()
  const s = verifyStrings(site, input.locale ?? "vi")
  const { html, text } = renderEmail({
    site,
    heading: s.heading,
    intro: s.intro,
    buttonLabel: s.button,
    link,
    hint: s.hint,
  })
  const res = await sendMail({ to: input.email, subject: s.subject, html, text })
  if (!res.ok) console.error("[auth-mailer] sendMail verify", res.error)
  return { ok: true, authId: data.user.id }
}

function emailChangeStrings(
  site: string,
  locale: AuthMailLocale,
): RecoveryStrings {
  if (locale === "en") {
    return {
      subject: `Confirm your new ${site} email`,
      heading: "Confirm your new email",
      intro: `A request was made to change the email on your ${site} account to this address. Click below to confirm the change.`,
      button: "Confirm new email",
      hint: "If you didn't request this, you can ignore this email and your address stays unchanged.",
    }
  }
  return {
    subject: `Xác nhận email mới cho ${site}`,
    heading: "Xác nhận email mới",
    intro: `Có yêu cầu đổi email tài khoản ${site} sang địa chỉ này. Nhấn nút bên dưới để xác nhận thay đổi.`,
    button: "Xác nhận email mới",
    hint: "Nếu bạn không yêu cầu, hãy bỏ qua email này và địa chỉ sẽ giữ nguyên.",
  }
}

// Đổi email (UC-66): tạo link xác nhận gửi tới email MỚI qua SMTP (không dùng
// updateUser của Supabase). public.users.email đồng bộ bởi trigger 037 sau khi
// người dùng xác nhận. (Giả định "Secure email change" của Supabase tắt — chỉ
// cần xác nhận một phía email mới.)
export async function sendEmailChangeVerification(
  currentEmail: string,
  newEmail: string,
  locale: AuthMailLocale = "vi",
): Promise<{ ok: true } | { ok: false; code: string }> {
  const admin = createAdminClient()
  const redirectTo = `${siteUrl()}/auth/callback?next=/settings`

  const { data, error } = await admin.auth.admin.generateLink({
    type: "email_change_new",
    email: currentEmail,
    newEmail,
    options: { redirectTo },
  })
  const link = data?.properties?.action_link
  if (error || !link) {
    if (error) console.error("[auth-mailer] generateLink email_change", error.message)
    return { ok: false, code: error?.code || "email_change_failed" }
  }

  const site = await siteName()
  const s = emailChangeStrings(site, locale)
  const { html, text } = renderEmail({
    site,
    heading: s.heading,
    intro: s.intro,
    buttonLabel: s.button,
    link,
    hint: s.hint,
  })
  const res = await sendMail({ to: newEmail, subject: s.subject, html, text })
  if (!res.ok) {
    console.error("[auth-mailer] sendMail email_change", res.error)
    return { ok: false, code: "send_failed" }
  }
  return { ok: true }
}
