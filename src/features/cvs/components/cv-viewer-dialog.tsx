"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Download, ExternalLink, FileText, Loader2, X } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import {
  getApplicantResumeUrlAction,
  getCvViewUrlAction,
} from "../api/read-actions"

type CommonProps = {
  open: boolean
  onClose: () => void
  title: string
}

type MemberSource = CommonProps & { kind: "member"; cvId: number }
type CompanySource = CommonProps & { kind: "company"; applicationId: number }
type ExternalSource = CommonProps & { kind: "external"; url: string }
type Props = MemberSource | CompanySource | ExternalSource

// Trình duyệt iOS (Safari/Chrome) không render PDF trong <iframe>. Phát hiện sớm
// để hiển thị nút "Mở trong tab mới" thay vì khung trắng.
function isInlinePdfUnsupported(): boolean {
  if (typeof window === "undefined") return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || /Android/.test(ua)
}

// Fragment giúp Chrome/Edge bật toolbar, fit ngang trang, ẩn panel side.
function withPdfHash(url: string): string {
  if (url.includes("#")) return url
  return `${url}#toolbar=1&navpanes=0&view=FitH`
}

function ViewerBody(props: Props) {
  const t = useTranslations("cvs.viewer")
  const [url, setUrl] = useState<string | null>(
    props.kind === "external" ? props.url : null,
  )
  const [error, setError] = useState<string | null>(null)
  const inlineUnsupported = useMemo(() => isInlinePdfUnsupported(), [])

  useEffect(() => {
    if (props.kind === "external") return
    let cancelled = false
    void (async () => {
      const res =
        props.kind === "member"
          ? await getCvViewUrlAction({ cvId: props.cvId })
          : await getApplicantResumeUrlAction({ applicationId: props.applicationId })
      if (cancelled) return
      if (res.ok) setUrl(res.data.url)
      else setError(res.error ?? t("loadError"))
    })()
    return () => {
      cancelled = true
    }
  }, [props, t])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }
  if (!url) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (inlineUnsupported) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 bg-muted/30">
        <div className="w-14 h-14 rounded-2xl bg-background ring-1 ring-foreground/10 inline-flex items-center justify-center">
          <FileText className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {t("mobileHint")}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <ExternalLink className="w-4 h-4" />
          {t("openInTab")}
        </a>
      </div>
    )
  }
  return (
    <iframe
      src={withPdfHash(url)}
      title={props.title}
      className="flex-1 w-full bg-muted/30"
    />
  )
}

export function CvViewerDialog(props: Props) {
  const t = useTranslations("cvs.viewer")

  async function resolveUrl(): Promise<string | null> {
    if (props.kind === "external") return props.url
    if (props.kind === "member") {
      const res = await getCvViewUrlAction({ cvId: props.cvId })
      return res.ok ? res.data.url : null
    }
    const res = await getApplicantResumeUrlAction({
      applicationId: props.applicationId,
    })
    return res.ok ? res.data.url : null
  }

  return (
    <Dialog open={props.open} onOpenChange={(o) => (o ? null : props.onClose())}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 max-w-[min(96vw,1100px)] sm:max-w-[min(96vw,1100px)] w-[min(96vw,1100px)] h-[92vh] sm:h-[88vh] rounded-2xl overflow-hidden flex flex-col"
      >
        <DialogTitle className="sr-only">{props.title}</DialogTitle>
        <DialogDescription className="sr-only">{t("description")}</DialogDescription>

        <div className="flex items-center justify-between px-3 sm:px-5 h-12 shrink-0 border-b border-foreground/5">
          <p className="font-semibold text-sm text-foreground truncate pr-3">
            {props.title}
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <ToolbarAction
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              label={t("openInTab")}
              getUrl={resolveUrl}
              mode="open"
            />
            <ToolbarAction
              icon={<Download className="w-3.5 h-3.5" />}
              label={t("download")}
              getUrl={resolveUrl}
              mode="download"
            />
            <button
              type="button"
              onClick={props.onClose}
              aria-label={t("close")}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <ViewerBody {...props} />
      </DialogContent>
    </Dialog>
  )
}

// Lấy signed URL mới mỗi lần click (URL hiển thị có thể hết hạn 5'). `mode="download"`
// thêm hint download attribute; mode="open" chỉ mở tab mới.
function ToolbarAction({
  icon,
  label,
  getUrl,
  mode,
}: {
  icon: React.ReactNode
  label: string
  getUrl: () => Promise<string | null>
  mode: "open" | "download"
}) {
  const [busy, setBusy] = useState(false)

  async function handle() {
    setBusy(true)
    try {
      const u = await getUrl()
      if (!u) return
      if (mode === "download") {
        const a = document.createElement("a")
        a.href = u
        a.target = "_blank"
        a.rel = "noopener noreferrer"
        a.download = ""
        a.click()
      } else {
        window.open(u, "_blank", "noopener,noreferrer")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      title={label}
      aria-label={label}
      className="h-8 px-2 inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
