import { redirect } from "next/navigation"

import { getCurrentUser } from "@/features/auth/api/auth-server"

export default async function Home() {
  const user = await getCurrentUser()
  redirect(user ? "/home" : "/login")
}
