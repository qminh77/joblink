"use client"

import { useEffect, useState } from "react"
import { useLocale } from "next-intl"

import { formatRelativeTime } from "./format"

// Một global subscriber list — tất cả component dùng cùng 1 interval thay vì
// mỗi component tự setInterval (giảm overhead khi feed có nhiều bài).
const subscribers = new Set<() => void>()
let intervalId: ReturnType<typeof setInterval> | null = null

function ensureInterval() {
  if (intervalId != null || typeof window === "undefined") return
  intervalId = setInterval(() => {
    for (const fn of subscribers) fn()
  }, 30_000)
}

function subscribe(fn: () => void): () => void {
  subscribers.add(fn)
  ensureInterval()
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0 && intervalId != null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }
}

/**
 * Hiển thị thời gian tương đối ("5 phút trước") theo locale next-intl + auto
 * refresh mỗi 30s khi mốc thời gian còn tươi.
 */
export function useRelativeTime(value: string | Date | null | undefined): string {
  const locale = useLocale()
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!value) return
    return subscribe(() => setTick((n) => n + 1))
  }, [value])

  return formatRelativeTime(value, locale)
}

/**
 * Trả về một formatter (value) => string, gắn 1 lần vào tick global. Dùng khi
 * cần format nhiều mốc thời gian trong cùng 1 component (vd: list comments,
 * list notifications) — tránh gọi hook trong vòng lặp.
 */
export function useRelativeTimeFormatter(): (
  value: string | Date | null | undefined,
) => string {
  const locale = useLocale()
  const [, setTick] = useState(0)

  useEffect(() => {
    return subscribe(() => setTick((n) => n + 1))
  }, [])

  return (value) => formatRelativeTime(value, locale)
}
