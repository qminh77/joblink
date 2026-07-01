import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateAfterConnectionChange() {
  revalidatePath("/profile", "layout")
}
