export function formatSalary(
  input: {
    salaryMin: number | null
    salaryMax: number | null
    salaryVisible: boolean
  },
  locale = "vi",
  currency?: string,
): string | null {
  if (!input.salaryVisible) return null
  const { salaryMin: min, salaryMax: max } = input
  if (min == null && max == null) return null
  const intlLoc = locale === "vi" ? "vi-VN" : locale === "en" ? "en-US" : locale
  const fmt = new Intl.NumberFormat(intlLoc)
  if (min != null && max != null) {
    const range = `${fmt.format(min)} – ${fmt.format(max)}`
    return currency ? `${range} ${currency}` : range
  }
  const val = fmt.format(min ?? max ?? 0)
  return currency ? `${val} ${currency}` : val
}

export function formatLocation(parts: {
  wardName: string | null
  provinceName: string | null
}): string | null {
  const out = [parts.wardName, parts.provinceName].filter(Boolean).join(", ")
  return out || null
}
