"use client"

import { useState, useTransition, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Save, Sparkles, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

import { saveBrandSettings } from "../api/actions"
import { ImageUploadField } from "./image-upload-field"
import { BrandPreview } from "./brand-preview"
import type { BrandSettings } from "../types"

export function BrandPanel({ settings }: { settings: BrandSettings }) {
  const t = useTranslations("admin.brand")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [siteName, setSiteName] = useState(settings.siteName)
  const [siteDescription, setSiteDescription] = useState(
    settings.siteDescription ?? "",
  )
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl)
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)

  const handleClearLogo = useCallback(() => {
    setLogoUrl(null)
    setLogoFile(null)
  }, [])

  const handleClearFavicon = useCallback(() => {
    setFaviconUrl(null)
    setFaviconFile(null)
  }, [])

  const submit = () => {
    if (!siteName.trim()) {
      toast.error(t("nameRequired"))
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("siteName", siteName)
      formData.set("siteDescription", siteDescription)
      formData.set("logoUrl", logoUrl ?? "")
      formData.set("faviconUrl", faviconUrl ?? "")
      if (logoFile) formData.set("logoFile", logoFile)
      if (faviconFile) formData.set("faviconFile", faviconFile)

      const result = await saveBrandSettings(formData)
      if (!result.ok) {
        toast.error(t("saveError"))
        return
      }
      toast.success(t("saved"))
      setLogoFile(null)
      setFaviconFile(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Main form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Site Identity */}
          <div className="bg-card border border-border/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-border/20">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-sm">
                  {t("identity.title")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("identity.description")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("fields.siteName")}
                </label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Joblink"
                  className="rounded-lg max-w-md"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  {t("fields.siteDescription")}
                </label>
                <Textarea
                  rows={2}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  placeholder={t("fields.descriptionPlaceholder")}
                  className="rounded-lg max-w-xl resize-none"
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-card border border-border/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <div className="pb-2 border-b border-border/20">
              <h2 className="font-semibold text-foreground text-sm">
                {t("logo.title")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("logo.description")}
              </p>
            </div>

            <ImageUploadField
              label={t("fields.logo")}
              description={t("logo.hint")}
              currentUrl={settings.logoUrl}
              onChange={(file) => {
                setLogoFile(file)
                if (file) {
                  setLogoUrl(URL.createObjectURL(file))
                }
              }}
              onClear={handleClearLogo}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              aspectRatio="square"
              maxSizeMB={2}
            />
          </div>

          {/* Favicon */}
          <div className="bg-card border border-border/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-5">
            <div className="pb-2 border-b border-border/20">
              <h2 className="font-semibold text-foreground text-sm">
                {t("favicon.title")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("favicon.description")}
              </p>
            </div>

            <ImageUploadField
              label={t("fields.favicon")}
              description={t("favicon.hint")}
              currentUrl={settings.faviconUrl}
              onChange={(file) => {
                setFaviconFile(file)
                if (file) {
                  setFaviconUrl(URL.createObjectURL(file))
                }
              }}
              onClear={handleClearFavicon}
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
              aspectRatio="square"
              maxSizeMB={1}
            />
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 space-y-6">
            <BrandPreview
              siteName={siteName}
              siteDescription={siteDescription || null}
              logoUrl={logoUrl}
              faviconUrl={faviconUrl}
            />

            {/* Actions */}
            <div className="bg-card border border-border/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {t("actions.title")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("actions.description")}
                </p>
              </div>
              <Separator />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={submit}
                  disabled={pending}
                  className="rounded-lg gap-2 w-full"
                >
                  {pending ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {pending ? t("saving") : t("saveAll")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
