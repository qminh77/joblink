"use client"

import { useTranslations } from "next-intl"
import { Check, Clock, UserCheck, UserMinus, UserPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  useAcceptConnectionRequest,
  useCancelConnectionRequest,
  useRejectConnectionRequest,
  useRemoveConnection,
  useSendConnectionRequest,
} from "../hooks"
import type { ConnectionRelation } from "../types"

type Size = "sm" | "default"

export function ConnectButton({
  relation,
  targetUserId,
  size = "default",
  fullWidth = false,
}: {
  relation: ConnectionRelation
  targetUserId: number
  size?: Size
  fullWidth?: boolean
}) {
  const t = useTranslations("network.button")
  const send = useSendConnectionRequest()
  const cancel = useCancelConnectionRequest()
  const accept = useAcceptConnectionRequest()
  const reject = useRejectConnectionRequest()
  const remove = useRemoveConnection()

  if (relation.kind === "self") return null

  const widthClass = fullWidth ? "w-full" : ""

  if (relation.kind === "none" || relation.kind === "rejected") {
    return (
      <Button
        size={size}
        className={`rounded-lg ${widthClass}`}
        disabled={send.isPending}
        onClick={() => send.mutate(targetUserId)}
      >
        <UserPlus className="w-3.5 h-3.5 mr-1" />
        {send.isPending ? t("sending") : t("connect")}
      </Button>
    )
  }

  if (relation.kind === "pending_outgoing") {
    return (
      <Button
        size={size}
        variant="secondary"
        className={`rounded-lg ${widthClass}`}
        disabled={cancel.isPending}
        onClick={() => cancel.mutate(relation.connectionId)}
      >
        <Clock className="w-3.5 h-3.5 mr-1" />
        {cancel.isPending ? t("canceling") : t("pendingOutgoing")}
      </Button>
    )
  }

  if (relation.kind === "pending_incoming") {
    return (
      <div className={`flex gap-2 ${widthClass}`}>
        <Button
          size={size}
          className="rounded-lg flex-1"
          disabled={accept.isPending}
          onClick={() => accept.mutate(relation.connectionId)}
        >
          <Check className="w-3.5 h-3.5 mr-1" /> {t("accept")}
        </Button>
        <Button
          size={size}
          variant="outline"
          className="rounded-lg flex-1"
          disabled={reject.isPending}
          onClick={() => reject.mutate(relation.connectionId)}
        >
          <X className="w-3.5 h-3.5 mr-1" /> {t("reject")}
        </Button>
      </div>
    )
  }

  if (relation.kind === "accepted") {
    return (
      <Button
        size={size}
        variant="outline"
        className={`rounded-lg ${widthClass}`}
        disabled={remove.isPending}
        onClick={() => {
          if (window.confirm(t("removeConfirm"))) {
            remove.mutate(relation.connectionId)
          }
        }}
      >
        {remove.isPending ? (
          <>
            <UserMinus className="w-3.5 h-3.5 mr-1" /> {t("removing")}
          </>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 mr-1" /> {t("connected")}
          </>
        )}
      </Button>
    )
  }

  return (
    <Button
      size={size}
      variant="outline"
      className={`rounded-lg ${widthClass}`}
      disabled
    >
      {t("unavailable")}
    </Button>
  )
}
