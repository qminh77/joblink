import "server-only"

import type { createClient } from "@/lib/supabase/server"

import type { SearchCompany, SearchPerson } from "../types"

// Tìm theo prefix/substring (ilike) — DB có sẵn extension pg_trgm + index nên
// %ilike% đủ nhanh. RLS lo việc chỉ trả hồ sơ mà viewer được phép thấy
// (public/kết nối/own); thêm chặn private cho chắc.

type Supabase = Awaited<ReturnType<typeof createClient>>

function likeOf(q: string): string {
  return `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
}

export async function searchPeople(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<SearchPerson[]> {
  const { data } = await supabase
    .from("member_profiles")
    .select("user_id, full_name, avatar_url, headline")
    .ilike("full_name", likeOf(q))
    .neq("profile_visibility", "private")
    .is("deleted_at", null)
    .limit(limit)
  return (data ?? [])
    .filter((m) => m.full_name)
    .map((m) => ({
      userId: m.user_id,
      name: m.full_name,
      avatarUrl: m.avatar_url,
      headline: m.headline,
    }))
}

export async function searchCompanies(
  supabase: Supabase,
  q: string,
  limit: number,
): Promise<SearchCompany[]> {
  const { data } = await supabase
    .from("company_profiles")
    .select("user_id, name, logo_url, industry")
    .ilike("name", likeOf(q))
    .is("deleted_at", null)
    .limit(limit)
  return (data ?? [])
    .filter((c) => c.name)
    .map((c) => ({
      userId: c.user_id,
      name: c.name,
      logoUrl: c.logo_url,
      industry: c.industry,
    }))
}
