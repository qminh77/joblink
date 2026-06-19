import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { Json, MemberCvRow } from "@/types/database"

// Lớp data-access của feature CV. KHÔNG auth/i18n; chạy bằng client RLS-aware
// (createClient của @supabase/ssr). Action ở `api/actions.ts` gọi unwrap/assertOk.

type Supabase = Awaited<ReturnType<typeof createClient>>

const now = () => new Date().toISOString()

export function listMemberCvs(supabase: Supabase, userId: number) {
  return supabase
    .from("member_cvs")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
}

export function findMemberCv(
  supabase: Supabase,
  cvId: number,
  userId: number,
) {
  return supabase
    .from("member_cvs")
    .select("*")
    .eq("id", cvId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle<MemberCvRow>()
}

export function insertMemberCv(
  supabase: Supabase,
  values: {
    userId: number
    fileName: string
    storagePath: string
    fileSize: number
    mimeType: string
    source?: string
    builderConfig?: Json | null
    isDefault: boolean
  },
) {
  return supabase
    .from("member_cvs")
    .insert({
      user_id: values.userId,
      file_name: values.fileName,
      storage_path: values.storagePath,
      file_size: values.fileSize,
      mime_type: values.mimeType,
      source: values.source ?? "upload",
      builder_config: values.builderConfig ?? null,
      is_default: values.isDefault,
    })
    .select("*")
    .single<MemberCvRow>()
}

export function renameMemberCv(
  supabase: Supabase,
  cvId: number,
  userId: number,
  fileName: string,
) {
  return supabase
    .from("member_cvs")
    .update({ file_name: fileName, updated_at: now() })
    .eq("id", cvId)
    .eq("user_id", userId)
}

export function softDeleteMemberCv(
  supabase: Supabase,
  cvId: number,
  userId: number,
) {
  return supabase
    .from("member_cvs")
    .update({ deleted_at: now(), is_default: false, updated_at: now() })
    .eq("id", cvId)
    .eq("user_id", userId)
}

// Đếm số CV đang hoạt động — dùng để quyết định auto-set default cho CV mới
// upload khi user chưa có CV nào.
export async function countActiveCvs(supabase: Supabase, userId: number) {
  const { count } = await supabase
    .from("member_cvs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("deleted_at", null)
  return count ?? 0
}
