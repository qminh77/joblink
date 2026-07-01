import type { AdminAuditLogEntry } from "@/features/admin/types"

export function groupByDate(
  entries: AdminAuditLogEntry[],
): Map<string, AdminAuditLogEntry[]> {
  const groups = new Map<string, AdminAuditLogEntry[]>()
  for (const entry of entries) {
    const date = new Date(entry.createdAt)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    const items = groups.get(key) ?? []
    items.push(entry)
    groups.set(key, items)
  }
  return groups
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  const week = Math.floor(day / 7)
  if (week < 4) return `${week}w`
  return `${Math.floor(day / 30)}mo`
}

export function formatActionLabel(action: string): string {
  return action
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
