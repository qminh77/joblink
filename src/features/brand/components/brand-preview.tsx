"use client"

import { useTranslations } from "next-intl"
import { Globe, Smartphone } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type BrandPreviewProps = {
  siteName: string
  siteDescription: string | null
  logoUrl: string | null
  faviconUrl: string | null
}

export function BrandPreview({
  siteName,
  siteDescription,
  logoUrl,
  faviconUrl,
}: BrandPreviewProps) {
  const t = useTranslations("admin.brand.preview")

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-primary" />
          {t("title")}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("subtitle")}
        </p>
      </div>

      {/* Browser Tab Preview */}
      <Card className="overflow-hidden border border-border/30 rounded-xl">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border/20">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-background rounded-md text-xs text-muted-foreground flex-1 max-w-md mx-auto">
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconUrl} alt="" className="w-3.5 h-3.5" />
            ) : (
              <Globe className="w-3.5 h-3.5" />
            )}
            <span className="truncate">{siteName || "Joblink"}</span>
          </div>
        </div>

        {/* Site Preview */}
        <div className="p-4 sm:p-6 flex items-center gap-4">
          {logoUrl ? (
            <Avatar className="w-14 h-14 rounded-xl border border-border/20">
              <AvatarImage src={logoUrl} alt={siteName} />
              <AvatarFallback className="rounded-xl text-lg font-bold bg-primary/10 text-primary">
                {(siteName || "J").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
              <Globe className="w-6 h-6 text-muted-foreground/60" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-base truncate">
              {siteName || "Joblink"}
            </p>
            {siteDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {siteDescription}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Form Factor Previews */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 border border-border/30 rounded-xl space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("desktop")}
          </p>
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <Avatar className="w-8 h-8 rounded-lg border border-border/10">
                <AvatarImage src={logoUrl} alt="" />
                <AvatarFallback className="rounded-lg text-xs">
                  {(siteName || "J").charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Globe className="w-4 h-4 text-muted-foreground/60" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{siteName || "Joblink"}</p>
              {siteDescription && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {siteDescription}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 border border-border/30 rounded-xl space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("mobile")}
          </p>
          <div className="flex items-center gap-2">
            {faviconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconUrl} alt="" className="w-6 h-6 rounded" />
            ) : (
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                <Globe className="w-3 h-3 text-muted-foreground/60" />
              </div>
            )}
            <p className="text-xs font-medium truncate">{siteName || "Joblink"}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
