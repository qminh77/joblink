import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateSettingsViews() {
  revalidatePath("/settings")
  revalidatePath("/profile/edit")
  revalidatePath("/home")
}
