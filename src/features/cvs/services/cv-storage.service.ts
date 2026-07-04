import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { createClient } from "@/lib/supabase/server"

import { CV_BUCKET, CV_SIGNED_URL_TTL_SECONDS } from "../lib/constants"

type Supabase = Awaited<ReturnType<typeof createClient>>

type StorageResult<T> =
  | { data: T; error: null }
  | { data: null; error: unknown }

export async function createCvSignedUrl(
  supabase: Supabase,
  storagePath: string,
): Promise<StorageResult<string>> {
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(storagePath, CV_SIGNED_URL_TTL_SECONDS)

  if (error || !data) return { data: null, error }
  return { data: data.signedUrl, error: null }
}

export async function createAdminCvSignedUrl(
  storagePath: string,
): Promise<StorageResult<string>> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(CV_BUCKET)
    .createSignedUrl(storagePath, CV_SIGNED_URL_TTL_SECONDS)

  if (error || !data) return { data: null, error }
  return { data: data.signedUrl, error: null }
}

export async function removeCvStorageObject(
  storagePath: string,
): Promise<{ error: unknown | null }> {
  const admin = createAdminClient()
  const { error } = await admin.storage.from(CV_BUCKET).remove([storagePath])
  return { error }
}
