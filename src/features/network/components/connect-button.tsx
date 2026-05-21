"use client"

import { useTranslations } from "next-intl"
import { Check, Clock, UserCheck, UserMinus, UserPlus, X } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import {
  useAcceptConnectionRequest,
  useCancelConnectionRequest,
  useConnectionRelation,
  useRejectConnectionRequest,
  useRemoveConnection,
  useSendConnectionRequest,
  useSentConnectionIds,
} from "../hooks"
import type { ConnectionRelation } from "../types"

type Size = "sm" | "default"

type Props = {
  relation: ConnectionRelation
  targetUserId: number
  size?: Size
  fullWidth?: boolean
}

export function ConnectButton({
  relation: initialRelation,
  targetUserId,
  size = "default",
  fullWidth = false,
}: Props) {
  const t = useTranslations("network.button")
  const { data } = useConnectionRelation(targetUserId, initialRelation)
  const relation = data ?? initialRelation
  const sentIds = useSentConnectionIds()

  const send = useSendConnectionRequest()
  const cancel = useCancelConnectionRequest()
  const accept = useAcceptConnectionRequest()
  const reject = useRejectConnectionRequest()
  const remove = useRemoveConnection()

  if (relation.kind === "self") return null

  const widthClass = fullWidth ? "w-full" : ""

  // Khi vừa gửi (mutation success nhưng query relation chưa kịp refetch), dùng
  // sentIds để hiển thị trạng thái "đang chờ" ngay — tránh nháy về "Connect".
  const isOptimisticSent =
    sentIds.has(targetUserId) && relation.kind === "none"

  if (relation.kind === "pending_outgoing" || isOptimisticSent) {
    const isPending = cancel.isPending
    return (
      <Button
        size={size}
        variant="secondary"
        className={widthClass}
        disabled={isPending || relation.kind !== "pending_outgoing"}
        onClick={() => {
          if (relation.kind === "pending_outgoing") {
            cancel.mutate(relation.connectionId)
          }
        }}
      >
        <Clock />
        {isPending ? t("canceling") : t("pendingOutgoing")}
      </Button>
    )
  }

  if (relation.kind === "none" || relation.kind === "rejected") {
    return (
      <Button
        size={size}
        className={widthClass}
        disabled={send.isPending}
        onClick={() => send.mutate(targetUserId)}
      >
        <UserPlus />
        {send.isPending ? t("sending") : t("connect")}
      </Button>
    )
  }

  if (relation.kind === "pending_incoming") {
    return (
      <div className={`flex gap-2 ${widthClass}`}>
        <Button
          size={size}
          className="flex-1"
          disabled={accept.isPending}
          onClick={() => accept.mutate(relation.connectionId)}
        >
          <Check /> {t("accept")}
        </Button>
        <Button
          size={size}
          variant="ghost"
          className="flex-1 hover:bg-destructive/10 hover:text-destructive"
          disabled={reject.isPending}
          onClick={() => reject.mutate(relation.connectionId)}
        >
          <X /> {t("reject")}
        </Button>
      </div>
    )
  }

  if (relation.kind === "accepted") {
    const acceptedConnectionId = relation.connectionId
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size={size}
            variant="ghost"
            className={widthClass}
            disabled={remove.isPending}
          >
            {remove.isPending ? (
              <>
                <UserMinus /> {t("removing")}
              </>
            ) : (
              <>
                <UserCheck /> {t("connected")}
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("removeDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t("removeDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={() => remove.mutate(acceptedConnectionId)}
            >
              {t("removeDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button
      size={size}
      variant="ghost"
      className={widthClass}
      disabled
    >
      {t("unavailable")}
    </Button>
  )
}
