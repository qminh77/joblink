import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { ProvinceRow } from "@/types/database"

import {
  getActiveProvinces,
  getActiveWardsByProvince,
} from "../services/location-query.service"

export async function loadProvinces(): Promise<ProvinceRow[]> {
  const supabase = await createClient()
  return getActiveProvinces(supabase)
}

export async function loadWardsByProvince(provinceId: number) {
  const supabase = await createClient()
  return getActiveWardsByProvince(supabase, provinceId)
}
