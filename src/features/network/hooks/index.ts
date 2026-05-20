"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  cancelConnectionRequestAction,
  removeConnectionAction,
  respondConnectionRequestAction,
  sendConnectionRequestAction,
} from "../api/actions"

type ActionResult = { ok: true } | { ok: false; error: string }

async function run<TArgs>(
  action: (args: TArgs) => Promise<ActionResult>,
  args: TArgs,
) {
  const result = await action(args)
  if (!result.ok) throw new Error(result.error)
}

function useNetworkMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<void>,
  successKey:
    | "sent"
    | "canceled"
    | "accepted"
    | "rejected"
    | "removed",
) {
  const router = useRouter()
  const t = useTranslations("network.toast")
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(t(successKey))
      router.refresh()
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useSendConnectionRequest() {
  return useNetworkMutation<number>(
    (targetUserId) => run(sendConnectionRequestAction, targetUserId),
    "sent",
  )
}

export function useCancelConnectionRequest() {
  return useNetworkMutation<number>(
    (connectionId) => run(cancelConnectionRequestAction, connectionId),
    "canceled",
  )
}

export function useAcceptConnectionRequest() {
  return useNetworkMutation<number>(
    async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, true)
      if (!result.ok) throw new Error(result.error)
    },
    "accepted",
  )
}

export function useRejectConnectionRequest() {
  return useNetworkMutation<number>(
    async (connectionId) => {
      const result = await respondConnectionRequestAction(connectionId, false)
      if (!result.ok) throw new Error(result.error)
    },
    "rejected",
  )
}

export function useRemoveConnection() {
  return useNetworkMutation<number>(
    (connectionId) => run(removeConnectionAction, connectionId),
    "removed",
  )
}
