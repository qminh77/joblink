"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { KeyRound } from "lucide-react"

import {
  isPasskeySupported,
  signInWithPasskeyClient,
} from "@/features/auth/api/passkey-client"

// UC: đăng nhập passwordless bằng Passkey. Chỉ hiện khi trình duyệt hỗ trợ
// WebAuthn (kiểm tra sau mount để tránh lệch hydration).
export function PasskeySignInButton() {
  const t = useTranslations("auth.passkey")
  const router = useRouter()
  const [supported, setSupported] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isPasskeySupported())
  }, [])

  if (!supported) return null

  async function handleClick() {
    setLoading(true)
    try {
      await signInWithPasskeyClient()
      router.push("/home")
    } catch {
      setLoading(false)
      toast.error(t("signInError"))
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-12 inline-flex items-center justify-center gap-2.5 rounded-xl border border-border bg-card hover:bg-muted/50 text-sm font-semibold text-foreground transition-colors disabled:opacity-50"
    >
      <KeyRound className="w-5 h-5 text-primary" />
      {loading ? t("signingIn") : t("signIn")}
    </button>
  )
}
