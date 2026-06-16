import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { AuthLayout } from "@/features/auth/components/auth-layout"
import { RegisterForm } from "@/features/auth/components/register-form"
import { loadPublicAuthSettings } from "@/features/system-settings/api/public-settings"

export const dynamic = "force-dynamic"

export default async function RegisterPage() {
  const [t, settings] = await Promise.all([
    getTranslations("auth.register"),
    loadPublicAuthSettings(),
  ])

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      contentClassName="max-w-xl"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link
            className="font-semibold text-primary transition-colors hover:text-primary/80"
            href="/login"
          >
            {t("login")}
          </Link>
        </p>
      }
    >
      <RegisterForm recaptcha={settings.recaptcha} />
    </AuthLayout>
  )
}
