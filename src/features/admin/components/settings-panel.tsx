"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  Lock,
  Mail,
  MapPin,
  Phone,
  PlugZap,
  Save,
  Send,
  Shield,
  Sparkles,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  sendTestEmail,
  testSmtpConnection,
  updateSystemSettings,
} from "@/features/admin/api/settings"
import type { AdminSettingsMap, AdminSettingsValue } from "@/features/admin/types"

const GROUP_ORDER = [
  "site_identity",
  "regional",
  "smtp",
  "recaptcha",
  "security",
  "contact",
  "maintenance",
] as const

const GROUP_ICONS = {
  site_identity: Sparkles,
  regional: MapPin,
  smtp: Mail,
  recaptcha: Lock,
  security: Shield,
  contact: Phone,
  maintenance: Wrench,
} as const

const BOOLEAN_KEYS = new Set([
  "recaptcha_enabled",
  "require_2fa_admin",
  "maintenance_mode",
  "google_auth_enabled",
])
const NUMBER_KEYS = new Set([
  "smtp_port",
  "login_rate_limit",
  "upload_max_mb",
])
const ARRAY_KEYS = new Set(["available_locales"])
const SECRET_KEYS = new Set([
  "smtp_password",
  "smtp_username",
  "recaptcha_secret",
])
const TEXTAREA_KEYS = new Set([
  "site_description",
  "contact_address",
  "contact_content",
  "maintenance_message",
])

export function SettingsPanel({
  initialValues,
  groups,
}: {
  initialValues: AdminSettingsMap
  groups: Record<string, string[]>
}) {
  const t = useTranslations("admin.settings")
  const tGroups = useTranslations("admin.settings.groups")
  const tFields = useTranslations("admin.settings.fields")
  const router = useRouter()
  const [values, setValues] = useState<AdminSettingsMap>(initialValues)
  const [pending, startTransition] = useTransition()

  const setKey = (key: string, value: AdminSettingsValue) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const submit = () => {
    startTransition(async () => {
      const result = await updateSystemSettings(values)
      if (!result.ok) {
        toast.error(t("title"))
        return
      }
      toast.success(t("saved"))
      router.refresh()
    })
  }

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Tabs defaultValue="site_identity">
        <TabsList className="bg-muted/60 p-1 rounded-xl flex-wrap">
          {GROUP_ORDER.map((g) => {
            const Icon = GROUP_ICONS[g]
            return (
              <TabsTrigger
                key={g}
                value={g}
                className="rounded-lg text-sm px-3 gap-1.5"
              >
                <Icon className="w-4 h-4" />
                {tGroups(g)}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {GROUP_ORDER.map((group) => (
          <TabsContent key={group} value={group} className="mt-4 space-y-4">
            <Card className="bg-card border-border/30 rounded-2xl p-6 space-y-5">
              {(groups[group] ?? []).map((key) => (
                <Field
                  key={key}
                  k={key}
                  label={tFields(key as never)}
                  value={values[key] ?? null}
                  onChange={(v) => setKey(key, v)}
                />
              ))}
            </Card>
            {group === "smtp" ? <SmtpTestCard /> : null}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending} className="rounded-lg gap-1.5">
          <Save className="w-4 h-4" />
          {pending ? t("saving") : t("saveAll")}
        </Button>
      </div>
    </>
  )
}

function SmtpTestCard() {
  const t = useTranslations("admin.settings.smtpTest")
  const [recipient, setRecipient] = useState("")
  const [pending, startTransition] = useTransition()

  const handleVerify = () => {
    startTransition(async () => {
      const result = await testSmtpConnection()
      if (!result.ok) {
        toast.error(t("failed", { error: result.error }))
        return
      }
      toast.success(t("connectionOk"))
    })
  }

  const handleSend = () => {
    startTransition(async () => {
      const result = await sendTestEmail(recipient.trim())
      if (!result.ok) {
        toast.error(t("failed", { error: result.error }))
        return
      }
      toast.success(t("sendOk"))
    })
  }

  return (
    <Card className="bg-card border-border/30 rounded-2xl p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <PlugZap className="w-4 h-4 text-primary" />
          {t("title")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("description")}
        </p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">
          {t("recipient")}
        </label>
        <Input
          type="email"
          placeholder={t("recipientPlaceholder")}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="rounded-lg max-w-md"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={pending}
          onClick={handleVerify}
          className="rounded-lg gap-1.5"
        >
          <PlugZap className="w-4 h-4" />
          {pending ? t("verifying") : t("verify")}
        </Button>
        <Button
          disabled={pending}
          onClick={handleSend}
          className="rounded-lg gap-1.5"
        >
          <Send className="w-4 h-4" />
          {pending ? t("sending") : t("send")}
        </Button>
      </div>
    </Card>
  )
}

function Field({
  k,
  label,
  value,
  onChange,
}: {
  k: string
  label: string
  value: AdminSettingsValue
  onChange: (v: AdminSettingsValue) => void
}) {
  if (BOOLEAN_KEYS.has(k)) {
    return (
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    )
  }
  if (NUMBER_KEYS.has(k)) {
    return (
      <div>
        <label className="text-sm font-medium mb-1.5 block">{label}</label>
        <Input
          type="number"
          value={typeof value === "number" ? value : Number(value ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rounded-lg max-w-xs"
        />
      </div>
    )
  }
  if (ARRAY_KEYS.has(k)) {
    return (
      <div>
        <label className="text-sm font-medium mb-1.5 block">{label}</label>
        <Input
          value={Array.isArray(value) ? value.join(",") : (value as string) ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          className="rounded-lg max-w-md"
        />
      </div>
    )
  }
  if (TEXTAREA_KEYS.has(k)) {
    return (
      <div>
        <label className="text-sm font-medium mb-1.5 block">{label}</label>
        <Textarea
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg max-w-md resize-none"
        />
      </div>
    )
  }
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <Input
        type={SECRET_KEYS.has(k) ? "password" : "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg max-w-md"
      />
    </div>
  )
}
