import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { ProfileVisibility } from "@/types/database"

// Data-access cho settings (RLS client). Đổi mật khẩu KHÔNG ở đây — đó là thao
// tác auth (supabase.auth.*), nằm trong action.

type Supabase = Awaited<ReturnType<typeof createClient>>

const now = () => new Date().toISOString()

export function updateMemberPrivacy(
  supabase: Supabase,
  userId: number,
  values: { profileVisibility: ProfileVisibility; openToWork: boolean },
) {
  return supabase
    .from("member_profiles")
    .update({
      profile_visibility: values.profileVisibility,
      open_to_work: values.openToWork,
      updated_at: now(),
    })
    .eq("user_id", userId)
}

export function updateCompanyOpenToHire(
  supabase: Supabase,
  userId: number,
  openToHire: boolean,
) {
  return supabase
    .from("company_profiles")
    .update({ open_to_hire: openToHire, updated_at: now() })
    .eq("user_id", userId)
}

export function updateUserLocale(
  supabase: Supabase,
  userId: number,
  locale: "vi" | "en",
) {
  return supabase
    .from("users")
    .update({ locale, updated_at: now() })
    .eq("id", userId)
}

// SRS UC-56: đổi SĐT — reset phone_verified_at vì SĐT mới chưa được xác minh.
// Xác minh SĐT qua OTP nằm ngoài danh sách 67 UC của SRS hiện tại.
export function updateUserPhone(
  supabase: Supabase,
  userId: number,
  phone: string | null,
) {
  return supabase
    .from("users")
    .update({ phone, phone_verified_at: null, updated_at: now() })
    .eq("id", userId)
}
