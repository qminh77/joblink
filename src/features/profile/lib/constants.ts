import type { ProfileVisibility } from "@/types/database"
import { AUDIENCE_VISIBILITIES } from "@/lib/visibility"

export const PROFILE_VISIBILITIES =
  AUDIENCE_VISIBILITIES satisfies readonly ProfileVisibility[]

export const PROFILE_VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  public: "Công khai",
  connections: "Chỉ kết nối",
  private: "Riêng tư",
}
