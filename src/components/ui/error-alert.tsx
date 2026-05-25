import { AlertCircle, X } from "lucide-react"

import { cn } from "@/lib/utils"

type Variant = "destructive" | "warning"

const VARIANT_CLASSES: Record<Variant, string> = {
  destructive:
    "border-destructive/40 bg-destructive/10 text-destructive",
  warning:
    "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
}

export function ErrorAlert({
  message,
  onDismiss,
  variant = "destructive",
  className,
}: {
  message: string
  onDismiss?: () => void
  variant?: Variant
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="leading-snug">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="dismiss"
          className="ml-auto -mr-1 p-0.5 rounded-md hover:bg-current/15"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : null}
    </div>
  )
}
