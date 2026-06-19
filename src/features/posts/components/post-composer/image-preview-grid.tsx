"use client"

import { Plus, X } from "lucide-react"

export type PreviewImage = {
  id: string
  previewUrl: string
}

export function ImagePreviewGrid({
  images,
  onRemove,
  onAddMore,
  addMoreLabel,
}: {
  images: PreviewImage[]
  onRemove: (id: string) => void
  onAddMore?: () => void
  addMoreLabel: string
}) {
  if (images.length === 1) {
    const image = images[0]!
    return (
      <div className="relative mt-3 rounded-xl overflow-hidden border border-border/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.previewUrl}
          alt=""
          className="w-full max-h-64 object-contain bg-muted/20"
        />
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="remove"
        >
          <X className="w-4 h-4" />
        </button>
        {onAddMore ? (
          <button
            type="button"
            onClick={onAddMore}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors text-[12px] font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> {addMoreLabel}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative aspect-square rounded-lg overflow-hidden border border-border/30 bg-muted/20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
            aria-label="remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {onAddMore ? (
        <button
          type="button"
          onClick={onAddMore}
          className="aspect-square rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors flex flex-col items-center justify-center gap-1 text-[11px]"
        >
          <Plus className="w-5 h-5" />
          <span>{addMoreLabel}</span>
        </button>
      ) : null}
    </div>
  )
}
