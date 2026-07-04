import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateNotifications() {
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
}

export function revalidateNotificationSettings() {
  revalidatePath("/settings")
}
