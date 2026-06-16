import type { ReactNode } from "react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { Briefcase, Building2, Users } from "lucide-react"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

type AuthLayoutProps = {
  /** Heading shown above the form (e.g. "Welcome back"). */
  title: string
  /** Supporting line under the heading. */
  subtitle: string
  /** The form rendered in the right pane. */
  children: ReactNode
  /** Optional footer (links) rendered under the form. */
  footer?: ReactNode
  /** Extra classes for the form container — use to widen the pane (e.g. register). */
  contentClassName?: string
}

/**
 * Split auth shell: branded photo hero on the left (desktop only), form on the
 * right. Shared by login / register / forgot-password so the chrome lives in
 * one place. Server component — hero copy comes from `auth.hero` messages.
 */
export async function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  contentClassName,
}: AuthLayoutProps) {
  const t = await getTranslations("auth.hero")

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      {/* Locale + theme controls float over the form pane on every breakpoint */}
      <div className="fixed right-3 top-3 z-50 flex items-center gap-1 sm:right-4 sm:top-4">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Left: branding hero (desktop only) */}
      <aside className="relative hidden w-1/2 lg:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-hidden">
          <Image
            src="/auth-hero.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
          {/* Brand wash + bottom legibility gradient (theme-independent) */}
          <div className="absolute inset-0 bg-primary-fixed-variant/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-fixed-variant via-primary-fixed-variant/55 to-primary-fixed-variant/25" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white xl:p-12">
            {/* Brand */}
            <div className="flex items-center gap-2.5 duration-700 animate-in fade-in">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                <Briefcase className="size-5" />
              </span>
              <span className="font-headline text-2xl font-extrabold tracking-tight drop-shadow-sm">
                JobLink
              </span>
            </div>

            {/* Value proposition + trust */}
            <div className="space-y-10 fill-mode-both delay-100 duration-700 animate-in fade-in slide-in-from-bottom-6">
              <div className="max-w-md space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim">
                  {t("tagline")}
                </p>
                <h1 className="font-headline text-4xl font-bold leading-tight drop-shadow-sm xl:text-[2.75rem]">
                  {t("headline")}
                </h1>
                <p className="text-base leading-relaxed text-primary-fixed-dim xl:text-lg">
                  {t("description")}
                </p>
              </div>

              <div className="flex items-center gap-5 text-sm font-medium text-primary-fixed">
                <div className="flex items-center gap-2">
                  <Building2 className="size-5 shrink-0 text-primary-fixed-dim" />
                  <span>
                    <span className="font-bold text-white">
                      {t("companiesValue")}
                    </span>{" "}
                    {t("companiesLabel")}
                  </span>
                </div>
                <div className="h-5 w-px bg-white/30" />
                <div className="flex items-center gap-2">
                  <Users className="size-5 shrink-0 text-primary-fixed-dim" />
                  <span>
                    <span className="font-bold text-white">
                      {t("candidatesValue")}
                    </span>{" "}
                    {t("candidatesLabel")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: form pane */}
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-14 sm:px-10 lg:w-1/2">
        <div
          className={cn(
            "w-full max-w-md duration-500 animate-in fade-in slide-in-from-bottom-2",
            contentClassName,
          )}
        >
          {/* Mobile brand (hidden once the hero shows) */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-5" />
            </span>
            <span className="font-headline text-xl font-extrabold tracking-tight text-foreground">
              JobLink
            </span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {children}

          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </main>
    </div>
  )
}
