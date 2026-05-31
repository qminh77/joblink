import "server-only"

import { getCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { CV_BUCKET, CV_SIGNED_URL_TTL_SECONDS } from "../lib/constants"
import { listMemberCvs } from "../data/cvs.repo"
import { mapMemberCv, type MemberCv, type MemberCvRow } from "../types"

// Tải danh sách CV của member hiện tại. KHÔNG kèm signed URL — UI list không
// cần preview ngay; chỉ generate signed URL khi user click "Xem".
export async function loadOwnCvs(): Promise<MemberCv[]> {
  const current = await getCurrentUser()
  if (!current || current.appUser.role !== "member") return []
  const supabase = await createClient()
  const { data } = await listMemberCvs(supabase, current.appUser.id)
  return ((data ?? []) as MemberCvRow[]).map(mapMemberCv)
}

// Sinh signed URL cho 1 storage path đã thuộc về user gọi. Trả null nếu lỗi.
// Bucket private — phải dùng admin/owner Supabase client; ở đây dùng client
// RLS (user JWT) — vì RLS policy "cv: owner select" cho phép owner đọc file.
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
