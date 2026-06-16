"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { useForgotPassword } from "../hooks"
import {
  createForgotPasswordSchema,
  type ForgotPasswordInput,
} from "../schemas"

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword")
  const tv = useTranslations("auth.validation")

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(createForgotPasswordSchema(tv)),
    defaultValues: { email: "" },
  })

  const forgotPassword = useForgotPassword()

  function onSubmit(values: ForgotPasswordInput) {
    forgotPassword.mutate(values, { onSuccess: () => form.reset() })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold text-foreground/80">
                {t("email")}
              </FormLabel>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Mail className="w-5 h-5" />
                </span>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="pl-11 h-12 bg-card border-border hover:bg-muted/30 transition-all duration-300 focus:bg-card focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={forgotPassword.isPending}
          className="w-full h-12 text-base font-semibold hover:opacity-90 transition-opacity duration-300 rounded-xl"
        >
          {forgotPassword.isPending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Form>
  )
}
