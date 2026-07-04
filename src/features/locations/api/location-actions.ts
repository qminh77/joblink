"use server"

import { loadWardsByProvince } from "./queries"

export type WardOption = { id: number; name: string }

// Server action cho client component <LocationSelect>: nạp Xã/Phường theo Tỉnh
// đã chọn (cascading). Trả về dạng tối giản {id, name} để render <Select>.
export async function fetchWardsAction(
  provinceId: number,
): Promise<WardOption[]> {
  if (!Number.isInteger(provinceId) || provinceId <= 0) return []
  const wards = await loadWardsByProvince(provinceId)
  return wards.map((w) => ({ id: w.id, name: w.name }))
}
