"use client"

import { useRef, useState, useCallback } from "react"
import { ImagePlus, Trash2, ZoomIn } from "lucide-react"
import { useTranslations } from "next-intl"

import { ImageLightbox } from "@/components/ui/image-lightbox"
import { cn } from "@/lib/utils"

export type ImageFieldProps = {
  label: string
  description: string
  currentUrl: string | null
  onChange: (file: File | null) => void
  onClear?: () => void
  accept?: string
  aspectRatio?: "square" | "wide"
  maxSizeMB?: number
}

export function ImageUploadField({
  label,
  description,
  currentUrl,
  onChange,
  onClear,
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  aspectRatio = "square",
  maxSizeMB = 2,
}: ImageFieldProps) {
  const t = useTranslations("admin.brand")
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const displayUrl = preview ?? currentUrl

  const handleFile = useCallback(
    (file: File | null) => {
      setError(null)
      if (!file) {
        setPreview(null)
        onChange(null)
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(t("fileTooLarge", { max: maxSizeMB }))
        return
      }

      const allowed = accept.split(",").map((s) => s.trim())
      if (!allowed.includes(file.type)) {
        setError(t("invalidType"))
        return
      }

      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
      onChange(file)
    },
    [accept, maxSizeMB, onChange, t],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
    onClear?.()
  }

  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{label}</label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex items-center justify-center border-2 border-dashed rounded-xl transition-colors cursor-pointer",
          "hover:border-primary/50 hover:bg-primary/5",
          error ? "border-destructive/50" : "border-border/40",
          aspectRatio === "square"
            ? "w-40 h-40"
            : "w-full max-w-md h-28",
        )}
      >
        {displayUrl ? (
          <div className="relative group w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt={label}
              className={cn(
                "w-full h-full object-contain rounded-xl",
                aspectRatio === "square" ? "p-3" : "p-2",
              )}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxOpen(true)
                }}
                className="p-1.5 bg-white/90 rounded-full text-foreground hover:bg-white transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove()
                }}
                className="p-1.5 bg-destructive/90 rounded-full text-destructive-foreground hover:bg-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-4 text-center">
            <ImagePlus className="w-8 h-8 text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground">
              {t("dropHint")}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              {t("maxSize", { max: maxSizeMB })}
            </span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}

      {lightboxOpen && displayUrl && (
        <ImageLightbox
          items={[{ url: displayUrl }]}
          initialIndex={0}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
