"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { KeyRound, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  deletePasskey,
  isPasskeySupported,
  listPasskeys,
  registerPasskey,
  type PasskeyItem,
} from "@/features/auth/api/passkey-client"
import { formatDate } from "@/lib/utils/format"

// Quản lý Passkey (WebAuthn) của người dùng: liệt kê / thêm / xoá. Chỉ render
// khi admin bật passkey (gate ở AccountInfoCard) và trình duyệt hỗ trợ.
export function PasskeysCard() {
  const t = useTranslations("settings.passkeys")
  const [supported, setSupported] = useState(false)
  const [list, setList] = useState<PasskeyItem[] | null>(null)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    try {
      setList(await listPasskeys())
    } catch {
      setList([])
    }
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Kiểm tra hỗ trợ sau khi mount để tránh lệch SSR/hydration; setState nằm
    // sau await (refresh) là async — đồng bộ trạng thái với hệ thống ngoài.
    const ok = isPasskeySupported()
    setSupported(ok)
    if (ok) void refresh()
    else setList([])
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function add() {
    setBusy(true)
    try {
      await registerPasskey()
      toast.success(t("added"))
      await refresh()
    } catch {
      toast.error(t("addError"))
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    setBusy(true)
    try {
      await deletePasskey(id)
      toast.success(t("deleted"))
      await refresh()
    } catch {
      toast.error(t("deleteError"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="rounded-2xl bg-card border-border/40 p-6 space-y-4">
      <div>
        <h2 className="font-headline font-bold text-base text-foreground flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" /> {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {!supported ? (
        <p className="text-sm text-muted-foreground">{t("unsupported")}</p>
      ) : list === null ? (
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      ) : (
        <>
          {list.length > 0 ? (
            <ul className="space-y-2">
              {list.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/40"
                >
                  <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {p.friendlyName || t("defaultName")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("created", { date: formatDate(p.createdAt) })}
                      {p.lastUsedAt
                        ? ` · ${t("lastUsed", { date: formatDate(p.lastUsedAt) })}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    disabled={busy}
                    aria-label={t("delete")}
                    className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          )}

          <Button size="sm" onClick={add} disabled={busy}>
            {busy ? t("adding") : t("add")}
          </Button>
        </>
      )}
    </Card>
  )
}
