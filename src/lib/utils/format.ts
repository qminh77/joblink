export function getInitials(name: string, fallback = "?"): string {
  const trimmed = name.trim()
  if (!trimmed) return fallback

  const parts = trimmed.split(/\s+/).slice(-2)
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2)
}

export function formatCurrency(
  value: number | null | undefined,
  currency: string = "VND",
  locale: string = "vi-VN",
): string {
  if (value == null) return ""
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value)
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string = "vi-VN",
): string {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale: string = "vi-VN",
): string {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  const diffMs = date.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ]

  for (const [unit, sec] of units) {
    if (Math.abs(diffSec) >= sec) {
      return rtf.format(Math.round(diffSec / sec), unit)
    }
  }
  return rtf.format(diffSec, "second")
}
