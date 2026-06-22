import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { CV_BUCKET, CV_SIGNED_URL_TTL_SECONDS } from "../lib/constants"
import { listMemberCvs } from "../data/cvs.repo"
import { mapMemberCv, type MemberCv, type MemberCvRow } from "../types"

// Tải danh sách CV của member hiện tại.
export async function loadOwnCvs(): Promise<MemberCv[]> {
  const current = await getCurrentUser()
  if (!current || current.appUser.account_type !== "member") return []
  const supabase = await createClient()
  const { data } = await listMemberCvs(supabase, current.appUser.id)
  return ((data ?? []) as MemberCvRow[]).map(mapMemberCv)
}

// Signed URL cho 1 storage_path trong bucket private `cvs`. Trả null nếu lỗi
// hoặc không có quyền (RLS policy "cvs: owner select" chỉ cho owner).
export async function getCvSignedUrl(
  storagePath: string,
): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(storagePath, CV_SIGNED_URL_TTL_SECONDS)
  if (error || !data) {
    console.error("[getCvSignedUrl]", error)
    return null
  }
  return data.signedUrl
}
