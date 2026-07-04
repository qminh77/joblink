import "server-only"

import { loadPublicAuthSettings } from "@/features/settings/services/public-settings.service"
import { sendMail } from "@/features/settings/services/smtp.service"

import type { NotificationCategory } from "../lib/preferences"

const CATEGORY_LABEL: Record<
  NotificationCategory,
  { vi: string; en: string }
> = {
  like: { vi: "Lượt thích", en: "Reactions" },
  comment: { vi: "Bình luận & nhắc tên", en: "Comments & mentions" },
  newConnection: { vi: "Kết nối", en: "Connections" },
  message: { vi: "Tin nhắn", en: "Messages" },
  jobMatch: { vi: "Việc làm & ứng tuyển", en: "Jobs & applications" },
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  )
}

export async function sendNotificationEmail(opts: {
  to: string
  category: NotificationCategory
  locale: string
}): Promise<void> {
  const isEn = opts.locale === "en"
  const label = CATEGORY_LABEL[opts.category][isEn ? "en" : "vi"]

  let site = "Joblink"
  try {
    site = (await loadPublicAuthSettings()).site.name || "Joblink"
  } catch {
    // dùng mặc định
  }

  const link = `${siteUrl()}/notifications`
  const subject = isEn
    ? `${site}: new notification (${label})`
    : `${site}: thông báo mới - ${label}`
  const heading = isEn ? "You have a new notification" : "Bạn có thông báo mới"
  const intro = isEn
    ? `There's new activity in your "${label}" notifications on ${site}.`
    : `Có hoạt động mới thuộc nhóm "${label}" trên ${site}.`
  const button = isEn ? "Open notifications" : "Xem thông báo"
  const hint = isEn
    ? "You're receiving this because you enabled email for this category. You can turn it off in notification settings."
    : "Bạn nhận email này vì đã bật kênh Email cho nhóm này. Có thể tắt trong Cài đặt thông báo."

  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f7;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#2563eb;color:#ffffff;padding:20px 24px;font-size:18px;font-weight:bold">${site}</div>
    <div style="padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${heading}</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#374151">${intro}</p>
      <a href="${link}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px">${button}</a>
      <p style="font-size:12px;line-height:1.6;margin:20px 0 0;color:#9ca3af">${hint}</p>
    </div>
  </div>
</body></html>`
  const text = `${heading}\n\n${intro}\n\n${button}: ${link}\n\n${hint}`

  const res = await sendMail({ to: opts.to, subject, html, text })
  if (!res.ok) console.error("[notification-mailer]", res.error)
}
