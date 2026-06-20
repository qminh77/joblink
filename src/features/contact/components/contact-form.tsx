"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useRecaptcha, type RecaptchaConfig } from "@/features/system-settings/components/use-recaptcha"

import { submitContactForm } from "../api/actions"

export function ContactForm({ recaptcha }: { recaptcha?: RecaptchaConfig }) {
  const t = useTranslations("contact.form")
  const tCommon = useTranslations("common")
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const { getToken } = useRecaptcha(recaptcha ?? { enabled: false, siteKey: null })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    startTransition(async () => {
      const form = e.currentTarget
      const fd = new FormData(form)

      const token = await getToken("contact_form")
      if (token) fd.set("recaptchaToken", token)

      const result = await submitContactForm(fd)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setSent(true)
      toast.success(t("success"))
    })
  }

  if (sent) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-16 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h3 className="text-xl font-semibold mb-2">{t("thankYou")}</h3>
          <p className="text-muted-foreground">{t("thankYouDesc")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("name")}</label>
          <Input
            name="name"
            required
            placeholder={t("namePlaceholder")}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("email")}</label>
          <Input
            name="email"
            type="email"
            required
            placeholder={t("emailPlaceholder")}
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("subject")}</label>
        <Input
          name="subject"
          placeholder={t("subjectPlaceholder")}
          className="rounded-lg"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("message")}</label>
        <Textarea
          name="message"
          required
          rows={6}
          placeholder={t("messagePlaceholder")}
          className="rounded-lg resize-none"
        />
      </div>

      <Button type="submit" disabled={pending} className="rounded-lg gap-2">
        <Send className="w-4 h-4" />
        {pending ? tCommon("sending") : t("submit")}
      </Button>
    </form>
  )
}
