"use server"

import { revalidatePath } from "next/cache"

import { requireAdminPermission } from "@/features/admin/api/admin-guard"
import { writeAuditLog } from "@/features/admin/api/audit-log"

import { brandUpdateSchema } from "../schemas"
import { loadBrandSettings, updateBrandSettings } from "../data/brand.repo"
import { uploadBrandImage, deleteBrandImage } from "./storage"
import type { BrandSettings } from "../types"

export async function getBrandSettings(): Promise<BrandSettings> {
  await requireAdminPermission("brand.view")
  return loadBrandSettings()
}

export async function saveBrandSettings(
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const current = await requireAdminPermission("brand.edit")

  const raw: Record<string, string | null> = {}
  for (const key of ["siteName", "siteDescription", "logoUrl", "faviconUrl"] as const) {
    const v = formData.get(key)
    raw[key] = typeof v === "string" && v.trim() ? v.trim() : null
  }

  const parsed = brandUpdateSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid_input" }

  const { siteName, siteDescription, logoUrl, faviconUrl } = parsed.data

  // Handle logo file upload
  const logoFile = formData.get("logoFile")
  let resolvedLogoUrl = logoUrl ?? null
  if (logoFile instanceof File && logoFile.size > 0) {
    const result = await uploadBrandImage(logoFile, "logo")
    if (!result.ok) return { ok: false, error: result.error }
    resolvedLogoUrl = result.url
    // Clean up old logo if exists
    const old = await loadBrandSettings()
    if (old.logoUrl && old.logoUrl !== resolvedLogoUrl) {
      await deleteBrandImage(old.logoUrl)
    }
  }

  // Handle favicon file upload
  const faviconFile = formData.get("faviconFile")
  let resolvedFaviconUrl = faviconUrl ?? null
  if (faviconFile instanceof File && faviconFile.size > 0) {
    const result = await uploadBrandImage(faviconFile, "favicon")
    if (!result.ok) return { ok: false, error: result.error }
    resolvedFaviconUrl = result.url
    const old = await loadBrandSettings()
    if (old.faviconUrl && old.faviconUrl !== resolvedFaviconUrl) {
      await deleteBrandImage(old.faviconUrl)
    }
  }

  const entries = [
    { key: "site_name", value: siteName },
    { key: "site_description", value: siteDescription ?? null },
    { key: "site_logo_url", value: resolvedLogoUrl },
    { key: "site_favicon_url", value: resolvedFaviconUrl },
  ]

  for (const entry of entries) {
    await updateBrandSettings(entry.key, entry.value, current.appUser.id)
  }

  await writeAuditLog({
    actorId: current.appUser.id,
    action: "brand.update",
    entityType: "system_settings",
    newData: {
      site_name: siteName,
      site_description: siteDescription,
      site_logo_url: resolvedLogoUrl,
      site_favicon_url: resolvedFaviconUrl,
    },
  })

  revalidatePath("/admin/brand")
  revalidatePath("/admin/audit-log")
  return { ok: true }
}
