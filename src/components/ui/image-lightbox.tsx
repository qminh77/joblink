"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export type LightboxItem = {
  url: string
  width?: number
  height?: number
}

export function ImageLightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: LightboxItem[]
  initialIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1)),
  )

  const prev = useCallback(
    () => setIndex((i) => (i - 1 + items.length) % items.length),
    [items.length],
  )
  const next = useCallback(
    () => setIndex((i) => (i + 1) % items.length),
    [items.length],
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose, prev, next])

  if (items.length === 0) return null
  const current = items[index]!
  const hasMany = items.length > 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-background/80 text-foreground hover:bg-muted transition-colors z-10"
          aria-label="close"
        >
          <X className="w-6 h-6" />
        </button>

        {hasMany ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                prev()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 text-foreground hover:bg-muted transition-colors z-10"
              aria-label="previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                next()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 text-foreground hover:bg-muted transition-colors z-10"
              aria-label="next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/80 text-foreground text-xs font-medium z-10">
              {index + 1} / {items.length}
            </div>
          </>
        ) : null}

        <motion.div
          key={current.url}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={current.url}
            alt=""
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
