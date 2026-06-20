import { getTranslations } from "next-intl/server"
import { Mail, Phone, MapPin } from "lucide-react"

import { loadPublicAuthSettings, loadPublicContactSettings } from "@/features/system-settings/api/public-settings"
import { ContactForm } from "@/features/contact/components/contact-form"

export const dynamic = "force-dynamic"

export default async function ContactPage() {
  const [t, recaptcha, contact] = await Promise.all([
    getTranslations("contact"),
    loadPublicAuthSettings(),
    loadPublicContactSettings(),
  ])

  const infoItems = [
    { key: "email", icon: Mail, href: contact.email ? `mailto:${contact.email}` : null, value: contact.email },
    { key: "phone", icon: Phone, href: contact.phone ? `tel:${contact.phone}` : null, value: contact.phone },
    { key: "address", icon: MapPin, href: null, value: contact.address },
  ].filter((item) => item.value)

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-8 px-4">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold">{t("page.title")}</h1>
        <p className="text-muted-foreground">
          {contact.content || t("page.subtitle")}
        </p>
      </div>

      <div className="bg-card border border-border/30 rounded-2xl p-6 md:p-8">
        <ContactForm recaptcha={recaptcha.recaptcha} />
      </div>

      {infoItems.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          {infoItems.map((item) => {
            const Icon = item.icon
            const content = item.href ? (
              <a
                href={item.href}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {item.value}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">{item.value}</p>
            )
            return (
              <div
                key={item.key}
                className="bg-card border border-border/30 rounded-2xl p-5 space-y-2 text-center"
              >
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Icon className="w-5 h-5" />
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    {t(`info.${item.key}`)}
                  </p>
                </div>
                {content}
              </div>
            )
          })}
        </div>
      )}

      {contact.mapUrl ? (
        <div className="rounded-2xl overflow-hidden border border-border/30 h-[320px] shadow-sm">
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
