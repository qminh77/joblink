import "server-only"

import { revalidatePath } from "next/cache"

export function revalidateProfile(userId: number) {
  revalidatePath("/profile/edit")
  revalidatePath(`/profile/${userId}`)
  revalidatePath("/profile/me")
  revalidatePath("/settings")
  revalidatePath("/home")
}
