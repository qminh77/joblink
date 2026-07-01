"use client"

import { useTranslations } from "next-intl"

export function useCvTranslations() {
  return useTranslations("cvs")
}

export function actionMessage(
  t: ReturnType<typeof useTranslations>,
  key: string,
) {
  return t(`messages.${key}`)
}
