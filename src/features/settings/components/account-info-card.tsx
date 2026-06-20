"use client"

import { useMemo } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Eye, Pencil, ShieldCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"

import { LocaleCard } from "./locale-card"

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

  const initials = getInitials(user.displayName)
  const selfHref = profileHref(user.id, user.role)

  const schema = useMemo(() => createAccountSchema(tv), [tv])
  const form = useForm<AccountInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: user.email, phone: phone ?? "" },
  })
  const updateAccount = useUpdateAccount()

  function onSubmit(values: AccountInput) {
    updateAccount.mutate(values, {
      onSuccess: (data) => {
        if (data?.emailChangeRequested) form.setValue("email", user.email)
      },
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="relative overflow-hidden">
          {user.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.coverUrl}
              alt=""
              className="h-20 sm:h-24 w-full object-cover bg-muted"
            />
          ) : (
            <div className="h-20 sm:h-24 bg-gradient-to-r from-primary/15 to-primary/5" />
          )}
          <div className="px-0 -mt-10 sm:-mt-12">
            <div className="flex items-end gap-3 sm:gap-4">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-background">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} />
                ) : null}
                <AvatarFallback className="text-base sm:text-lg font-semibold text-foreground bg-muted">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="font-headline font-bold text-base sm:text-lg text-foreground truncate">
                  {user.displayName}
                </h2>
                {user.headline ? (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {user.headline}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={selfHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem trang cá nhân
          </Link>
          {user.role === "member" ? (
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Chỉnh sửa hồ sơ
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-5">
        <h3 className="font-headline font-bold text-base text-foreground">
          {t("title")}
        </h3>

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
                <p className="text-xs text-muted-foreground mb-1">
                  {t("role")}
                </p>
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
                  <ShieldCheck className="w-3 h-3 mr-1" />{" "}
                  {tStatus(user.status)}
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
      </div>

      <LocaleCard initialLocale={locale} />
    </div>
  )
}
