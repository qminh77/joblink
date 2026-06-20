import { loadPublicAuthSettings, loadPublicContactSettings } from "@/features/system-settings/api/public-settings"
import { ContactForm } from "@/features/contact/components/contact-form"

export const dynamic = "force-dynamic"

export default async function ContactPage() {
  const [recaptcha, contact] = await Promise.all([
    loadPublicAuthSettings(),
    loadPublicContactSettings(),
  ])

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">Liên hệ hỗ trợ</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {contact.content ?? "Gửi câu hỏi, góp ý hoặc yêu cầu hỗ trợ cho chúng tôi."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-card border border-border/30 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Gửi yêu cầu</h2>
            <ContactForm recaptcha={recaptcha.recaptcha} />
          </div>
        </div>

        <div className="space-y-5">
          {contact.email ? (
            <div className="bg-card border border-border/30 rounded-2xl p-5 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</p>
              <a href={`mailto:${contact.email}`} className="text-sm font-medium hover:text-primary transition-colors">
                {contact.email}
              </a>
            </div>
          ) : null}

          {contact.phone ? (
            <div className="bg-card border border-border/30 rounded-2xl p-5 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Điện thoại</p>
              <a href={`tel:${contact.phone}`} className="text-sm font-medium hover:text-primary transition-colors">
                {contact.phone}
              </a>
            </div>
          ) : null}

          {contact.address ? (
            <div className="bg-card border border-border/30 rounded-2xl p-5 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Địa chỉ</p>
              <p className="text-sm text-muted-foreground">{contact.address}</p>
            </div>
          ) : null}
        </div>
      </div>

      {contact.mapUrl ? (
        <div className="rounded-2xl overflow-hidden border border-border/30 h-[300px]">
          <iframe
            src={contact.mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Bản đồ"
          />
        </div>
      ) : null}
    </div>
  )
}
