"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Lock,
  Mail,
  MapPin,
  Phone,
  PlugZap,
  Save,
  Send,
  Shield,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  sendTestEmail,
  testSmtpConnection,
  updateSystemSettings,
} from "@/features/admin/api/settings"
import type { AdminSettingsMap, AdminSettingsValue } from "@/features/admin/types"

const GROUP_ORDER = [
  "regional",
  "smtp",
  "recaptcha",
  "security",
  "contact",
  "maintenance",
] as const

const GROUP_ICONS = {
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
  "require_email_verification",
  "passkey_enabled",
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
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [values, setValues] = useState<AdminSettingsMap>(initialValues)
  const [pending, startTransition] = useTransition()

  const activeTab = searchParams.get("tab") || "site_identity"
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.replace(`${pathname}?${params.toString()}`)
  }

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

      <div className="mt-6 flex-1 min-w-0 pb-10">
        {GROUP_ORDER.map((group) => {
          if (group !== activeTab) return null

          return (
            <div key={group} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{tGroups(group)}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cấu hình các thiết lập liên quan đến {tGroups(group).toLowerCase()}
                  </p>
                </div>
                
                <div className="bg-card border border-border/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-6">
                  {(groups[group] ?? []).map((key) => (
                    <Field
                      key={key}
                      k={key}
                      label={tFields(key as never)}
                      value={values[key] ?? null}
                      onChange={(v) => setKey(key, v)}
                    />
                  ))}
                </div>
              </div>
              {group === "smtp" ? <div className="mt-6"><SmtpTestCard /></div> : null}
            </div>
          )
        })}

        <div className="mt-8 flex justify-end">
          <Button onClick={submit} disabled={pending} className="rounded-lg gap-2 px-6">
            <Save className="w-4 h-4" />
            {pending ? t("saving") : t("saveAll")}
          </Button>
        </div>
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
    <Card className="bg-transparent border-none shadow-none rounded-2xl p-4 sm:p-6 space-y-4">
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
      <div className="flex items-center justify-between py-1">
        <div>
          <label className="text-sm font-medium">{label}</label>
          <p className="text-xs text-muted-foreground mt-0.5">Bật hoặc tắt chức năng này</p>
        </div>
        <Switch
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    )
  }
  if (NUMBER_KEYS.has(k)) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
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
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <Input
          value={Array.isArray(value) ? value.join(", ") : (value as string) ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="Ví dụ: item1, item2, item3"
          className="max-w-xl rounded-lg"
        />
        <p className="text-[11px] text-muted-foreground mt-1">Cách nhau bằng dấu phẩy (,)</p>
      </div>
    )
  }
  if (TEXTAREA_KEYS.has(k)) {
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{label}</label>
        <Textarea
          rows={3}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg max-w-xl resize-none"
        />
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type={SECRET_KEYS.has(k) ? "password" : "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg max-w-md"
      />
    </div>
  )
}
