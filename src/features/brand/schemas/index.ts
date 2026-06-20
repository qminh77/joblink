import { z } from "zod"

export const brandUpdateSchema = z.object({
  siteName: z.string().trim().min(1).max(120),
  siteDescription: z.string().trim().max(500).nullable().optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
})

export type BrandUpdateInput = z.infer<typeof brandUpdateSchema>

export const BRAND_KEYS = [
  "site_name",
  "site_description",
  "site_logo_url",
  "site_favicon_url",
] as const
