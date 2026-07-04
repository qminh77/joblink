import "server-only"

import type { createClient } from "@/lib/supabase/server"
import type { ProvinceRow, WardRow } from "@/types/database"

type Supabase = Awaited<ReturnType<typeof createClient>>

export type WardLookupRow = Pick<
  WardRow,
  "id" | "province_id" | "code" | "name" | "name_en" | "sort_order" | "is_active"
>

export async function selectActiveProvinces(
  supabase: Supabase,
): Promise<ProvinceRow[]> {
  const { data } = await supabase
    .from("provinces")
    .select(
      "id, code, name, name_en, sort_order, is_active, created_at, updated_at, deleted_at",
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  return (data ?? []) as ProvinceRow[]
}

export async function selectActiveWardsByProvince(
  supabase: Supabase,
  provinceId: number,
): Promise<WardLookupRow[]> {
  const { data } = await supabase
    .from("wards")
    .select("id, province_id, code, name, name_en, sort_order, is_active")
    .eq("province_id", provinceId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })

  return (data ?? []) as WardLookupRow[]
}
