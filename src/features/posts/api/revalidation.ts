import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateHome() {
  revalidatePath("/home")
}
