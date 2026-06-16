import "server-only"

import type { createClient } from "@/lib/supabase/server"

// Data-access cho user_blocks bằng client RLS. Policy user_blocks_{select,insert,
// delete}_own chỉ cho phép thao tác trên dòng mà current user là `blocker_id`.
// Việc kiểm tra "có ai đó chặn TÔI không" và resolve hồ sơ người bị chặn (có thể
// để private) nằm ở blocks.privileged.ts vì RLS che các dòng đó.

type Supabase = Awaited<ReturnType<typeof createClient>>

export function findMyBlock(supabase: Supabase, me: number, target: number) {
  return supabase
    .from("user_blocks")
    .select("id")
    .eq("blocker_id", me)
    .eq("blocked_id", target)
    .limit(1)
    .maybeSingle<{ id: number }>()
}

export function insertBlock(supabase: Supabase, me: number, target: number) {
  return supabase
    .from("user_blocks")
    .insert({ blocker_id: me, blocked_id: target })
    .select("id")
    .single<{ id: number }>()
}

export function deleteBlock(supabase: Supabase, me: number, target: number) {
  return supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", me)
    .eq("blocked_id", target)
}
