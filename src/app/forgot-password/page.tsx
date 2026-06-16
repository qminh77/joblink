import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowLeft } from "lucide-react"

import { AuthLayout } from "@/features/auth/components/auth-layout"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const dynamic = "force-dynamic"

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword")

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <Link
          href="/login"
          className="flex items-center justify-center text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 size-4" />
          {t("backToLogin")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
