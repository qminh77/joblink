"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, ShieldCheck } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  challengeAndVerify,
  enrollTotp,
  listAllTotpFactors,
  listVerifiedTotpFactors,
  unenrollFactor,
  type EnrolledTotp,
} from "@/features/auth/api/mfa-client"

// UC-09/10: bật/tắt xác thực hai lớp bằng TOTP. Người dùng quét QR bằng Google
// Authenticator (hoặc nhập secret thủ công) rồi xác nhận mã 6 số để bật.
export function TwoFactorCard() {
  const t = useTranslations("settings.twoFactor")
  const [status, setStatus] = useState<"loading" | "off" | "on">("loading")
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null)
  const [enroll, setEnroll] = useState<EnrolledTotp | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState(false)

  async function refresh() {
    try {
      const factors = await listVerifiedTotpFactors()
      if (factors.length > 0) {
        setActiveFactorId(factors[0].id)
        setStatus("on")
      } else {
        setActiveFactorId(null)
        setStatus("off")
      }
    } catch {
      setStatus("off")
    }
  }

  useEffect(() => {
    // Đồng bộ trạng thái 2FA từ Supabase (hệ thống ngoài) khi mount; setState
    // nằm sau await nên không gây cascading render đồng bộ.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [])

  async function startEnroll() {
    setBusy(true)
    try {
      // Dọn các factor chưa xác minh còn sót để tránh tích tụ.
      const all = await listAllTotpFactors()
      for (const f of all) {
        if (f.status !== "verified") await unenrollFactor(f.id)
      }
      const enrolled = await enrollTotp()
      setEnroll(enrolled)
      setCode("")
    } catch {
      toast.error(t("enrollError"))
    } finally {
      setBusy(false)
    }
  }

  async function cancelEnroll() {
    if (enroll) {
      try {
        await unenrollFactor(enroll.factorId)
      } catch {
        // ignore
      }
    }
    setEnroll(null)
    setCode("")
  }

  async function confirmEnroll() {
    if (!enroll || code.trim().length < 6) return
    setBusy(true)
    try {
      await challengeAndVerify(enroll.factorId, code.trim())
      toast.success(t("enabled"))
      setEnroll(null)
      setCode("")
      await refresh()
    } catch {
      toast.error(t("invalidCode"))
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (!activeFactorId) return
    setBusy(true)
    try {
      await unenrollFactor(activeFactorId)
      toast.success(t("disabled"))
      setConfirmDisable(false)
      await refresh()
    } catch {
      toast.error(t("disableError"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-headline font-bold text-base text-foreground">
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        {status === "on" ? (
          <Badge
            variant="outline"
            className="border-0 bg-emerald-500/15 text-emerald-600 shrink-0"
          >
            <ShieldCheck className="w-3 h-3 mr-1" /> {t("statusOn")}
          </Badge>
        ) : null}
      </div>

      {status === "loading" ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : enroll ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("scanHint")}</p>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {enroll.qrCode.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enroll.qrCode}
                alt="QR"
                className="w-44 h-44 bg-white rounded-lg p-2 shrink-0"
              />
            ) : (
              <div
                className="w-44 h-44 bg-white rounded-lg p-2 shrink-0 [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: enroll.qrCode }}
              />
            )}
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-muted-foreground">{t("secretHint")}</p>
              <code className="block break-all text-xs bg-muted rounded-lg px-3 py-2 font-mono">
                {enroll.secret}
              </code>
            </div>
          </div>
          <div className="space-y-2 max-w-xs">
            <label className="text-sm font-medium">{t("codeLabel")}</label>
            <Input
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              placeholder="000000"
              className="h-10 rounded-xl tracking-widest text-center"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={confirmEnroll}
              disabled={busy || code.trim().length < 6}
            >
              {busy ? t("verifying") : t("verify")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancelEnroll}
              disabled={busy}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : status === "on" ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setConfirmDisable(true)}
          disabled={busy}
        >
          {t("disable")}
        </Button>
      ) : (
        <Button size="sm" onClick={startEnroll} disabled={busy}>
          {busy ? t("preparing") : t("enable")}
        </Button>
      )}

      <AlertDialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disableTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("disableDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                void disable()
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("disable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
