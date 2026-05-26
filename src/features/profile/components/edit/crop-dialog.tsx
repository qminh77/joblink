"use client"

import * as React from "react"
import { Loader2, ZoomIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  COVER_ASPECT,
  COVER_OUTPUT_HEIGHT,
  COVER_OUTPUT_WIDTH,
  AVATAR_OUTPUT_SIZE,
  type CropRect,
  type ProfileImageKind,
} from "@/features/profile/lib/media"
import { cn } from "@/lib/utils"

// Khung hiển thị trong dialog (px). Output thật vẫn cố định ở media.ts;
// đây chỉ là kích thước render preview.
const AVATAR_FRAME = 320
const COVER_FRAME_WIDTH = 560
const COVER_FRAME_HEIGHT = Math.round(COVER_FRAME_WIDTH / COVER_ASPECT)

const ZOOM_MAX_MULTIPLIER = 3 // cho phép zoom tối đa 3× so với mức "cover"
const ZOOM_STEP = 0.01

type Props = {
  file: File | null
  kind: ProfileImageKind
  busy?: boolean
  onCancel: () => void
  onConfirm: (crop: CropRect) => void
}

// Dialog crop dùng chung cho avatar (vuông, hiển thị tròn) và cover (3:1).
// Logic: scale "cover" — ảnh luôn lấp đầy khung. User chỉ điều chỉnh translate
// + zoom. Khi xác nhận, suy ngược ra CropRect trên hệ tọa độ ảnh gốc.
export function CropDialog({ file, kind, busy, onCancel, onConfirm }: Props) {
  const open = Boolean(file)
  const [bitmap, setBitmap] = React.useState<ImageBitmap | null>(null)
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)
  const [zoom, setZoom] = React.useState(1) // multiplier trên minScale
  const [tx, setTx] = React.useState(0)
  const [ty, setTy] = React.useState(0)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const frameW = kind === "avatar" ? AVATAR_FRAME : COVER_FRAME_WIDTH
  const frameH = kind === "avatar" ? AVATAR_FRAME : COVER_FRAME_HEIGHT

  // Đọc bitmap + ObjectURL preview mỗi khi file thay đổi.
  React.useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBitmap(null)
      setImageSrc(null)
      return
    }
    let cancelled = false
    const url = URL.createObjectURL(file)
    setImageSrc(url)
    setLoadError(null)

    createImageBitmap(file)
      .then((bm) => {
        if (cancelled) {
          bm.close()
          return
        }
        setBitmap(bm)
        setZoom(1)
        setTx(0)
        setTy(0)
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message)
      })

    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
  }, [file])

  // Cleanup bitmap khi unmount.
  React.useEffect(() => {
    return () => {
      if (bitmap) bitmap.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Khi user đóng dialog, reset hết để lần mở sau không hiện ảnh cũ.
  function handleCancel() {
    onCancel()
  }

  // Scale tối thiểu để ảnh lấp đầy khung (cover).
  const minScale = bitmap
    ? Math.max(frameW / bitmap.width, frameH / bitmap.height)
    : 1
  const scale = minScale * zoom

  const scaledW = bitmap ? bitmap.width * scale : 0
  const scaledH = bitmap ? bitmap.height * scale : 0

  // Bounds cho translate: ảnh phải luôn phủ khung.
  const minTx = frameW - scaledW
  const minTy = frameH - scaledH
  const maxTx = 0
  const maxTy = 0

  // Luôn render bằng giá trị đã clamp; khi zoom đổi, biên minTx/minTy cũng đổi
  // và clamp tự cập nhật. State tx/ty thô có thể "vượt biên" tạm thời nhưng
  // không hiển thị — drag tiếp theo đọc clampedTx/Ty làm baseline.
  const clampedTx = Math.min(maxTx, Math.max(minTx, tx))
  const clampedTy = Math.min(maxTy, Math.max(minTy, ty))

  // Pointer drag: capture pointer để vẫn nhận move khi ra ngoài khung.
  const dragRef = React.useRef<{ startX: number; startY: number; baseTx: number; baseTy: number } | null>(null)
  function handlePointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseTx: clampedTx,
      baseTy: clampedTy,
    }
  }
  function handlePointerMove(e: React.PointerEvent) {
    const d = dragRef.current
    if (!d) return
    setTx(d.baseTx + (e.clientX - d.startX))
    setTy(d.baseTy + (e.clientY - d.startY))
  }
  function handlePointerUp() {
    dragRef.current = null
  }

  function handleConfirm() {
    if (!bitmap) return
    // CropRect trên hệ tọa độ ảnh gốc:
    // điểm (0,0) của khung crop tương ứng (-tx/scale, -ty/scale) trên ảnh.
    const crop: CropRect = {
      x: -clampedTx / scale,
      y: -clampedTy / scale,
      width: frameW / scale,
      height: frameH / scale,
    }
    // Clamp lại an toàn (tránh sai số dấu phẩy khiến vượt biên ảnh gốc).
    crop.x = Math.max(0, Math.min(crop.x, bitmap.width - crop.width))
    crop.y = Math.max(0, Math.min(crop.y, bitmap.height - crop.height))
    onConfirm(crop)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) handleCancel()
      }}
    >
      <DialogContent className="sm:max-w-[640px] gap-4">
        <DialogHeader>
          <DialogTitle>
            {kind === "avatar"
              ? "Căn chỉnh ảnh đại diện"
              : "Căn chỉnh ảnh bìa"}
          </DialogTitle>
        </DialogHeader>

        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : !bitmap || !imageSrc ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div
                className={cn(
                  "relative overflow-hidden bg-muted/30 select-none touch-none cursor-grab active:cursor-grabbing",
                  kind === "avatar"
                    ? "rounded-full"
                    : "rounded-xl border border-border/40",
                )}
                style={{ width: frameW, height: frameH }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt=""
                  draggable={false}
                  className="absolute top-0 left-0 max-w-none pointer-events-none"
                  style={{
                    width: scaledW,
                    height: scaledH,
                    transform: `translate3d(${clampedTx}px, ${clampedTy}px, 0)`,
                  }}
                />
                {/* Lưới rule-of-thirds cho cover để căn nhanh */}
                {kind === "cover" ? (
                  <div className="absolute inset-0 pointer-events-none border border-white/30">
                    <div className="absolute top-0 bottom-0 left-1/3 border-l border-white/20" />
                    <div className="absolute top-0 bottom-0 left-2/3 border-l border-white/20" />
                    <div className="absolute left-0 right-0 top-1/3 border-t border-white/20" />
                    <div className="absolute left-0 right-0 top-2/3 border-t border-white/20" />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 px-2">
              <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={1}
                max={ZOOM_MAX_MULTIPLIER}
                step={ZOOM_STEP}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Kéo để di chuyển, kéo thanh trượt để phóng to. Kích thước xuất:{" "}
              {kind === "avatar"
                ? `${AVATAR_OUTPUT_SIZE}×${AVATAR_OUTPUT_SIZE}`
                : `${COVER_OUTPUT_WIDTH}×${COVER_OUTPUT_HEIGHT}`}{" "}
              px.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={busy}
            className="rounded-lg"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!bitmap || busy}
            className="rounded-lg"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Đang tải lên…
              </>
            ) : (
              "Lưu ảnh"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
