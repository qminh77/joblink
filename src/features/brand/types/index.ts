export type BrandSettings = {
  siteName: string
  siteDescription: string | null
  logoUrl: string | null
  faviconUrl: string | null
}

export type BrandSettingsMap = Record<string, string | null>

export type BrandActionResult =
  | { ok: true; data: BrandSettings }
  | { ok: false; error: string }
