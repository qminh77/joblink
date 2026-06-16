"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { SessionUserSummary } from "@/features/auth/types"
import { useUpdateAccount } from "@/features/settings/hooks"
import { createAccountSchema, type AccountInput } from "@/features/settings/schemas"

import { ChangePasswordCard } from "./change-password-card"
import { LocaleCard } from "./locale-card"
import { TwoFactorCard } from "./two-factor-card"

const STATUS_TONES: Record<SessionUserSummary["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  pending_verification: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  suspended: "bg-destructive/15 text-destructive border-destructive/30",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
  deleted: "bg-muted text-muted-foreground",
}

export function AccountInfoCard({
  user,
  phone,
  locale,
}: {
  user: SessionUserSummary
  phone: string | null
  locale: string
}) {
  const tv = useTranslations("settings.validation")
  const t = useTranslations("settings.account")
  const tRoles = useTranslations("settings.roles")
  const tStatus = useTranslations("settings.statuses")

  const schema = useMemo(() => createAccountSchema(tv), [tv])
  const form = useForm<AccountInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: user.email, phone: phone ?? "" },
  })
  const updateAccount = useUpdateAccount()

  function onSubmit(values: AccountInput) {
    updateAccount.mutate(values, {
      onSuccess: (data) => {
        // Email chỉ đổi sau khi xác nhận qua link → tạm trả field về email hiện
        // tại để không hiển thị nhầm là đã đổi.
        if (data?.emailChangeRequested) form.setValue("email", user.email)
      },
    })
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-5">
        <h2 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        {...field}
                        className="h-10 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        autoComplete="tel"
                        placeholder={t("phonePlaceholder")}
                        {...field}
                        value={field.value ?? ""}
                        className="h-10 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              {t("emailChangeHint")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("role")}</p>
                <p className="text-foreground">{tRoles(user.role)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {t("status")}
                </p>
                <Badge
                  variant="outline"
                  className={`border-0 ${STATUS_TONES[user.status]}`}
                >
                  <ShieldCheck className="w-3 h-3 mr-1" /> {tStatus(user.status)}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateAccount.isPending}
                className="inline-flex items-center text-xs font-semibold text-primary hover:bg-primary/10 px-3 h-8 rounded-lg transition-colors disabled:opacity-50"
              >
                {updateAccount.isPending ? t("saving") : t("save")}
              </button>
            </div>
          </form>
        </Form>
      </Card>

      <ChangePasswordCard />
      <TwoFactorCard />
      <LocaleCard initialLocale={locale} />
    </div>
  )
}
