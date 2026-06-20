import { BrandPanel } from "@/features/brand/components/brand-panel"
import { getBrandSettings } from "@/features/brand/api/actions"

export const dynamic = "force-dynamic"

export default async function AdminBrandPage() {
  const settings = await getBrandSettings()
  return <BrandPanel settings={settings} />
}
