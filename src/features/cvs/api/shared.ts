import "server-only"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { ActionError } from "@/lib/action/server"

export const validation = () => getTranslations("cvs.validation")

export function revalidateCvs() {
  revalidatePath("/profile/edit")
  revalidatePath("/jobs", "layout")
}

export function requirePositiveId(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw ActionError.key("invalidId")
  }
  return value
}
