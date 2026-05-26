export function getInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback
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
  locale: string = "vi",
): string {
  if (value == null) return ""
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency,
  }).format(value)
}

export function formatDate(
  value: string | Date | null | undefined,
  locale: string = "vi",
): string {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
  }).format(date)
}

export function formatCompactNumber(
  value: number | null | undefined,
  locale: string = "vi",
): string {
  if (value == null || Number.isNaN(value)) return "0"
  return new Intl.NumberFormat(toIntlLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

// Locale code dùng cho Intl APIs (next-intl trả về "vi" / "en").
function toIntlLocale(locale: string): string {
  if (locale === "vi") return "vi-VN"
  if (locale === "en") return "en-US"
  return locale
}

export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale: string = "vi",
): string {
  if (!value) return ""
  const date = typeof value === "string" ? new Date(value) : value
  const diffMs = date.getTime() - Date.now()
  const diffSec = Math.round(diffMs / 1000)
  const absSec = Math.abs(diffSec)

  // Dưới 45 giây → "vừa xong" / "just now" (đẹp hơn "X giây trước").
  if (absSec < 45) {
    return locale === "en" ? "just now" : "vừa xong"
  }

  const rtf = new Intl.RelativeTimeFormat(toIntlLocale(locale), {
    numeric: "auto",
  })

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ]

  for (const [unit, sec] of units) {
    if (absSec >= sec) {
      // Math.trunc: 89 giây = "1 phút trước", không phải "2 phút trước".
      const value = Math.trunc(diffSec / sec)
      return rtf.format(value, unit)
    }
  }
  return rtf.format(diffSec, "second")
}
