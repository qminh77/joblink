import type { ProfileVisibility } from "@/types/database"

export const PROFILE_VISIBILITIES = [
  "public",
  "connections",
  "private",
] as const satisfies readonly ProfileVisibility[]

export const PROFILE_VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  public: "Công khai",
  connections: "Chỉ kết nối",
  private: "Riêng tư",
}

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5000+",
] as const
