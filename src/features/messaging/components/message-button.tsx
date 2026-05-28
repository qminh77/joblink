"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { MessageSquare } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { useEnsureConversation } from "../hooks"
import { translateMessagingError } from "../lib/translate-error"

type Props = {
  targetUserId: number
  size?: "sm" | "default"
  variant?: "default" | "secondary" | "outline" | "ghost"
  fullWidth?: boolean
  disabled?: boolean
}

/**
 * Mở (hoặc tạo) conversation 1-1 với user khác và điều hướng tới /messages.
 * Chỉ enable khi hai user đã connected — server vẫn check lại RPC để an toàn.
 */
export function MessageButton({
  targetUserId,
  size = "default",
  variant = "ghost",
  fullWidth = false,
  disabled = false,
}: Props) {
  const t = useTranslations("messages.button")
  const tErr = useTranslations("messages.errors")
  const router = useRouter()
  const ensure = useEnsureConversation()

  const onClick = () => {
    ensure.mutate(targetUserId, {
      onSuccess: (conversationId) => {
        router.push(`/messages?c=${conversationId}`)
      },
      onError: (error) => {
        toast.error(translateMessagingError(tErr, error.message))
      },
    })
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={fullWidth ? "w-full" : ""}
      disabled={disabled || ensure.isPending}
      onClick={onClick}
    >
      <MessageSquare />
      {ensure.isPending ? t("opening") : t("message")}
    </Button>
  )
}
