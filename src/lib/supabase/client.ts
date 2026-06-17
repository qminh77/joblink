import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/types/database"

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Bật API Passkey (WebAuthn) của Supabase: auth.registerPasskey /
      // signInWithPasskey / passkey.* — không bật cờ sẽ throw khi gọi.
      auth: { experimental: { passkey: true } },
    },
  )
}
