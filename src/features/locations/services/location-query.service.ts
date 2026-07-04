import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { ProvinceRow } from "@/types/database"

import {
  selectActiveProvinces,
  selectActiveWardsByProvince,
  type WardLookupRow,
} from "../data/locations.repo"

type Supabase = Awaited<ReturnType<typeof createClient>>

export function getActiveProvinces(
  supabase: Supabase,
): Promise<ProvinceRow[]> {
  return selectActiveProvinces(supabase)
}

export function getActiveWardsByProvince(
  supabase: Supabase,
  provinceId: number,
): Promise<WardLookupRow[]> {
  if (!Number.isInteger(provinceId) || provinceId <= 0) {
    return Promise.resolve([])
  }
  return selectActiveWardsByProvince(supabase, provinceId)
}
