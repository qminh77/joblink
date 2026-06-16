import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { AuthLayout } from "@/features/auth/components/auth-layout"
import { LoginForm } from "@/features/auth/components/login-form"
import { loadPublicAuthSettings } from "@/features/system-settings/api/public-settings"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const [t, settings] = await Promise.all([
    getTranslations("auth.login"),
    loadPublicAuthSettings(),
  ])

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            className="font-semibold text-primary transition-colors hover:text-primary/80"
            href="/register"
          >
            {t("register")}
          </Link>
        </p>
      }
    >
      <LoginForm recaptcha={settings.recaptcha} />
    </AuthLayout>
  )
}
