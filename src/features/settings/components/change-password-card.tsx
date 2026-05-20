"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PasswordInput } from "@/features/auth/components/password-input"
import { useChangePassword } from "@/features/settings/hooks"
import {
  createChangePasswordSchema,
  type ChangePasswordInput,
} from "@/features/settings/schemas"

export function ChangePasswordCard() {
  const tv = useTranslations("settings.validation")
  const t = useTranslations("settings.password")
  const schema = useMemo(() => createChangePasswordSchema(tv), [tv])
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const changePassword = useChangePassword()

  function onSubmit(values: ChangePasswordInput) {
    changePassword.mutate(values, { onSuccess: () => form.reset() })
  }

  return (
    <Card className="rounded-2xl border-border/30 p-6">
      <h2 className="font-headline font-bold text-base text-foreground mb-1">
        {t("title")}
      </h2>
      <p className="text-xs text-muted-foreground mb-5">{t("subtitle")}</p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("current")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="current-password"
                    className="h-10 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("new")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    className="h-10 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("confirm")}</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="new-password"
                    className="h-10 rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-3 flex justify-end">
            <Button
              type="submit"
              disabled={changePassword.isPending}
              className="rounded-lg"
            >
              {changePassword.isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}
