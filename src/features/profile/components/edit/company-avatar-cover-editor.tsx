"use client"

import * as React from "react"
import { Building2, Camera, Image as ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  getProfileImageErrorMessage,
  PROFILE_IMAGE_ACCEPT,
  useCompanyProfileImageUpload,
} from "@/features/profile/hooks"
import {
  validateProfileImage,
  type CropRect,
  type ProfileImageKind,
} from "@/features/profile/lib/media"
import { getInitials } from "@/lib/utils/format"

import { CropDialog } from "./crop-dialog"

type Props = {
  userId: number
  companyName: string
  logoUrl: string | null
  coverUrl: string | null
}

export function CompanyAvatarCoverEditor({
  userId,
  companyName,
  logoUrl,
  coverUrl,
}: Props) {
  const initials = getInitials(companyName, "JL")
  const { busy, uploadImage } = useCompanyProfileImageUpload(userId)

  const [pending, setPending] = React.useState<{
    file: File
    kind: ProfileImageKind
  } | null>(null)

  const logoInputRef = React.useRef<HTMLInputElement | null>(null)
  const coverInputRef = React.useRef<HTMLInputElement | null>(null)

  function openPicker(kind: ProfileImageKind) {
    const input = kind === "avatar" ? logoInputRef.current : coverInputRef.current
    if (input) {
      input.value = ""
      input.click()
    }
  }

  function onFileChosen(kind: ProfileImageKind, file: File | undefined) {
    if (!file) return
    const code = validateProfileImage(file)
    if (code) {
      toast.error(getProfileImageErrorMessage(code))
      return
    }
    setPending({ file, kind })
  }

  async function handleConfirm(crop: CropRect) {
    if (!pending) return
    const ok = await uploadImage({
      file: pending.file,
      crop,
      kind: pending.kind,
    })
    if (ok) {
      setPending(null)
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border/40 p-0 gap-0">
      <div className="relative">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="w-full h-36 sm:h-44 object-cover bg-muted"
          />
        ) : (
          <div className="w-full h-36 sm:h-44 bg-gradient-to-r from-primary/80 to-blue-400" />
        )}

        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => openPicker("cover")}
          disabled={busy}
          className="absolute top-3 right-3 rounded-lg shadow-md backdrop-blur-sm bg-background/85 hover:bg-background"
        >
          {busy && pending?.kind === "cover" ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
          )}
          {coverUrl ? "Đổi ảnh bìa" : "Thêm ảnh bìa"}
        </Button>
      </div>

      <div className="px-6 pb-5">
        <div className="relative w-fit -mt-12">
          <Avatar className="w-24 h-24 border-4 border-card shadow-sm">
            {logoUrl ? <AvatarImage src={logoUrl} /> : null}
            <AvatarFallback className="text-lg font-semibold">
              {initials || <Building2 className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => openPicker("avatar")}
            disabled={busy}
            aria-label="Đổi logo công ty"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-card shadow-md flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {busy && pending?.kind === "avatar" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="mt-3">
          <h2 className="font-headline font-bold text-base text-foreground">
            {companyName}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nhấn vào nút máy ảnh để đổi logo, hoặc đổi ảnh bìa ở góc trên.
          </p>
        </div>
      </div>

      <input
        ref={logoInputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => onFileChosen("avatar", e.target.files?.[0])}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => onFileChosen("cover", e.target.files?.[0])}
      />

      <CropDialog
        file={pending?.file ?? null}
        kind={pending?.kind ?? "avatar"}
        busy={busy}
        onCancel={() => {
          if (!busy) setPending(null)
        }}
        onConfirm={handleConfirm}
      />
    </Card>
  )
}
