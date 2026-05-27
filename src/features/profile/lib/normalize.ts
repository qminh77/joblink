// Chuẩn hoá giá trị form trước khi ghi DB. Tách thành helper thuần để repo dùng
// lại và action không phải nhúng logic này.

/** Trim; chuỗi rỗng → null (để cột nullable lưu NULL thay vì ""). */
export function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

/** `YYYY-MM` → `YYYY-MM-01`; rỗng → null. */
export function normalizeDate(value: string | null | undefined): string | null {
  const cleaned = emptyToNull(value)
  if (!cleaned) return null
  if (/^\d{4}-\d{2}$/.test(cleaned)) return `${cleaned}-01`
  return cleaned
}
