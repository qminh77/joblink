"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { Lock, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { useLogin, AUTH_GATE_ERROR_KEYS } from "../hooks"
import { createLoginSchema, type LoginInput } from "../schemas"
import { type AuthGateErrorCode } from "../api/auth-client"

import { GoogleSignInButton } from "./google-sign-in-button"
import { PasswordInput } from "./password-input"

export function LoginForm({
  googleEnabled = false,
}: {
  googleEnabled?: boolean
} = {}) {
  const t = useTranslations("auth.login")
  const tv = useTranslations("auth.validation")
  const tErr = useTranslations("auth.errors")
  const schema = createLoginSchema(tv)

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  })

  const login = useLogin()

  async function onSubmit(values: LoginInput) {
    login.mutate(values)
  }

  const searchParams = useSearchParams()
  const reason = searchParams.get("reason") as AuthGateErrorCode | null

  useEffect(() => {
    if (reason && AUTH_GATE_ERROR_KEYS[reason]) {
      toast.error(tErr(AUTH_GATE_ERROR_KEYS[reason]))
    }
  }, [reason, tErr])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
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
                    className="pl-11 h-12 bg-card border-border focus:bg-card focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="font-semibold text-foreground/80">
                  {t("password")}
                </FormLabel>
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  prefetch={true}
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors z-10">
                  <Lock className="w-5 h-5" />
                </span>
                <FormControl>
                  <PasswordInput
                    {...field}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-11 h-12 bg-card border-border focus:bg-card focus:ring-1 focus:ring-primary/50 focus:border-primary rounded-xl"
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 pt-2 pb-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="rounded-md data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </FormControl>
              <FormLabel className="text-sm font-medium text-muted-foreground cursor-pointer">
                {t("rememberMe")}
              </FormLabel>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={login.isPending}
          className="w-full h-12 text-base font-semibold hover:opacity-90 transition-opacity duration-300 rounded-xl"
        >
          {login.isPending ? t("submitting") : t("submit")}
        </Button>

        {googleEnabled ? (
          <>
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">
                {t("orContinueWith")}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton />
          </>
        ) : null}
      </form>
    </Form>
  )
}
