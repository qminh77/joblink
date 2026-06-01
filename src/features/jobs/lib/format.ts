const vnNumber = new Intl.NumberFormat("vi-VN")

export function formatSalary(input: {
  salaryMin: number | null
  salaryMax: number | null
  salaryVisible: boolean
}): string | null {
  if (!input.salaryVisible) return null
  const { salaryMin: min, salaryMax: max } = input
  if (min == null && max == null) return null
  if (min != null && max != null) {
    return `${vnNumber.format(min)} – ${vnNumber.format(max)}`
  }
  return vnNumber.format(min ?? max ?? 0)
}

export function formatLocation(parts: {
  wardName: string | null
  provinceName: string | null
}): string | null {
  const out = [parts.wardName, parts.provinceName].filter(Boolean).join(", ")
  return out || null
}
