import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { ArrowLeft } from "lucide-react"

import { AuthLayout } from "@/features/auth/components/auth-layout"
import { UpdatePasswordForm } from "@/features/auth/components/update-password-form"

export const dynamic = "force-dynamic"

export default async function UpdatePasswordPage() {
  const t = await getTranslations("auth.updatePassword")

  return (
    <AuthLayout
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <Link
          href="/home"
          className="flex items-center justify-center text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 size-4" />
          {t("backToLogin")}
        </Link>
      }
    >
      <UpdatePasswordForm />
    </AuthLayout>
  )
}
