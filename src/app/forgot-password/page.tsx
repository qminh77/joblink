"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword")
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-body text-foreground relative bg-background">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px] px-4 py-8 relative z-10">
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <Logo size="md" />
            </div>

            <div className="text-center mb-8">
              <h1 className="text-2xl font-headline font-extrabold tracking-tight mb-2">
                {t("title")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("subtitle")}
              </p>
            </div>

            <div className="w-full">
              <ForgotPasswordForm />
            </div>

            <div className="mt-8 w-full">
              <Link
                href="/login"
                className="flex items-center justify-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("backToLogin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
