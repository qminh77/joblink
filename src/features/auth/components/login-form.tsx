"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Lock, Mail, ShieldCheck } from "lucide-react"
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
import { verifyAuthRecaptchaAction } from "@/features/system-settings/api/actions"
import {
  useRecaptcha,
  type RecaptchaConfig,
} from "@/features/system-settings/components/use-recaptcha"

import { challengeAndVerify } from "../api/mfa-client"
import { useLogin } from "../hooks"
import { createLoginSchema, type LoginInput } from "../schemas"

import { GoogleSignInButton } from "./google-sign-in-button"
import { PasswordInput } from "./password-input"

export function LoginForm({
  recaptcha,
}: {
  recaptcha?: RecaptchaConfig
} = {}) {
  const t = useTranslations("auth.login")
  const tv = useTranslations("auth.validation")
  const tErr = useTranslations("auth.errors")
  const schema = createLoginSchema(tv)

  const form = useForm<LoginInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  })

  const router = useRouter()
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState("")
  const [verifyingMfa, setVerifyingMfa] = useState(false)

  const login = useLogin({
    onMfaRequired: (factorId) => {
      setMfaFactorId(factorId)
      setMfaStep(true)
    },
  })
  const { enabled: captchaEnabled, getToken } = useRecaptcha(
    recaptcha ?? { enabled: false, siteKey: null },
  )
  const [verifying, setVerifying] = useState(false)

  // UC-09/10: bước nhập mã 2FA sau khi mật khẩu đúng (tài khoản đã bật 2FA).
  async function submitMfa() {
    if (mfaCode.trim().length < 6) return
    if (!mfaFactorId) {
      toast.error(tErr("mfaUnavailable"))
      return
    }
    setVerifyingMfa(true)
    try {
      await challengeAndVerify(mfaFactorId, mfaCode.trim())
      toast.success(t("success"))
      router.push("/home")
    } catch {
      toast.error(tErr("mfaInvalid"))
    } finally {
      setVerifyingMfa(false)
    }
  }

  async function onSubmit(values: LoginInput) {
    if (captchaEnabled) {
      setVerifying(true)
      const token = await getToken("login")
      const verification = await verifyAuthRecaptchaAction(token, "login")
      setVerifying(false)
      if (!verification.ok) {
        toast.error(tErr("recaptchaFailed"))
        return
      }
    }
    login.mutate(values)
  }

  if (mfaStep) {
    return (
      <div className="w-full space-y-4">
        <div className="space-y-1">
          <h2 className="font-headline font-bold text-lg text-foreground">
            {t("mfa.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("mfa.hint")}</p>
        </div>
        <Input
          value={mfaCode}
          onChange={(e) =>
            setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="h-12 rounded-xl text-center tracking-[0.4em] text-lg"
        />
        <Button
          type="button"
          onClick={submitMfa}
          disabled={verifyingMfa || mfaCode.trim().length < 6}
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          {verifyingMfa ? t("mfa.verifying") : t("mfa.verify")}
        </Button>
      </div>
    )
  }

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
          disabled={login.isPending || verifying}
          className="w-full h-12 text-base font-semibold hover:opacity-90 transition-opacity duration-300 rounded-xl"
        >
          {login.isPending || verifying ? t("submitting") : t("submit")}
        </Button>

        {captchaEnabled ? (
          <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            {t("protectedByRecaptcha")}
          </p>
        ) : null}

        <div className="flex items-center gap-3 pt-1">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">
            {t("orContinueWith")}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton />
      </form>
    </Form>
  )
}
