"use client"

import { useOptimistic, startTransition } from "react"
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
  const serverRelation = data ?? initialRelation

  const [relation, setOptimisticRelation] = useOptimistic(
    serverRelation,
    (_state, newRelation: ConnectionRelation) => newRelation
  )

  const send = useSendConnectionRequest()
  const cancel = useCancelConnectionRequest()
  const accept = useAcceptConnectionRequest()
  const reject = useRejectConnectionRequest()
  const remove = useRemoveConnection()

  if (relation.kind === "self") return null

  const widthClass = fullWidth ? "w-full" : ""

  if (relation.kind === "pending_outgoing") {
    const isPending = cancel.isPending
    return (
      <Button
        size={size}
        variant="secondary"
        className={widthClass}
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setOptimisticRelation({ kind: "none" })
            await cancel.mutateAsync(relation.connectionId).catch(() => {})
          })
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
        variant="ghost"
        className={`text-primary hover:bg-primary/10 hover:text-primary ${widthClass}`}
        disabled={send.isPending}
        onClick={() => {
          startTransition(async () => {
            setOptimisticRelation({ kind: "pending_outgoing", connectionId: -1 })
            await send.mutateAsync(targetUserId).catch(() => {})
          })
        }}
      >
        <UserPlus />
        {send.isPending ? t("sending") : t("connect")}
      </Button>
    )
  }

  if (relation.kind === "pending_incoming") {
    return (
      <div className={`flex gap-1 ${widthClass}`}>
        <Button
          size={size}
          variant="ghost"
          className="flex-1 text-primary hover:bg-primary/10 hover:text-primary"
          disabled={accept.isPending}
          onClick={() => {
            startTransition(async () => {
              setOptimisticRelation({
                kind: "accepted",
                connectionId: relation.connectionId,
              })
              await accept.mutateAsync(relation.connectionId).catch(() => {})
            })
          }}
        >
          <Check /> {t("accept")}
        </Button>
        <Button
          size={size}
          variant="ghost"
          className="flex-1 hover:bg-destructive/10 hover:text-destructive"
          disabled={reject.isPending}
          onClick={() => {
            startTransition(async () => {
              setOptimisticRelation({ kind: "rejected", connectionId: relation.connectionId })
              await reject.mutateAsync(relation.connectionId).catch(() => {})
            })
          }}
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
              onClick={() => {
                startTransition(async () => {
                  setOptimisticRelation({ kind: "none" })
                  await remove.mutateAsync(acceptedConnectionId).catch(() => {})
                })
              }}
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

