import { loadSystemSettings } from "@/features/admin/api/settings"
import { SettingsPanel } from "@/features/admin/components/settings-panel"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const { values, groups } = await loadSystemSettings()
  return <SettingsPanel initialValues={values} groups={groups} />
}
