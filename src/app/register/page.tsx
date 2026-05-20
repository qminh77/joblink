"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/language-switcher"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { RegisterForm } from "@/features/auth/components/register-form"

export default function RegisterPage() {
  const t = useTranslations("auth.register")
  return (
    <div className="min-h-screen w-full flex items-center justify-center font-body text-foreground relative bg-background py-8">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] px-4 py-4 relative z-10">
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
              <RegisterForm />
            </div>

            <p className="mt-8 text-center text-sm font-medium text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link
                className="text-primary hover:text-primary/80 transition-colors font-bold"
                href="/login"
              >
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
