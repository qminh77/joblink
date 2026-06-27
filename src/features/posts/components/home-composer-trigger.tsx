"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Briefcase, Image as ImageIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import { PostComposer } from "./post-composer"

export function HomeComposerTrigger() {
  const tHome = useTranslations("home")
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const [open, setOpen] = useState(false)
  const firstName = user.displayName.split(" ").slice(-1)[0] ?? ""

  return (
    <>
      <Card className="bg-card border-border/40 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-11 h-11 shrink-0 border border-border/40">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-grow bg-muted/40 hover:bg-muted/80 transition-colors text-left rounded-full px-5 py-3 text-sm text-muted-foreground border border-border/20 focus:outline-none"
          >
            {tHome("composerPlaceholder", { name: firstName })}
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border/30">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ImageIcon className="text-blue-500 w-4 h-4" />
            <span className="text-[11px] sm:text-xs font-semibold">
              {tHome("photoVideo")}
            </span>
          </button>
          {user.role === "company" ? (
            <Link
              href="/company/post-job"
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Briefcase className="text-emerald-500 w-4 h-4" />
              <span className="text-[11px] sm:text-xs font-semibold">
                {tHome("postJob")}
              </span>
            </Link>
          ) : null}
        </div>
      </Card>

      <PostComposer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
