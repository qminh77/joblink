"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  getNotificationPreferencesAction,
  updateNotificationPreferenceAction,
} from "../api/preference-actions"
import type { NotificationPreferenceMap } from "../lib/preferences"
import type { UpdateNotificationPreferenceInput } from "../schemas"
import { NOTIFICATION_PREFS_KEY } from "./keys"

export function useNotificationPreferences() {
  return useQuery<NotificationPreferenceMap>({
    queryKey: NOTIFICATION_PREFS_KEY,
    queryFn: getNotificationPreferencesAction,
    staleTime: 60_000,
  })
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient()
  const t = useTranslations("settings.notifications")
  return useMutation<
    void,
    Error,
    UpdateNotificationPreferenceInput,
    { snapshot?: NotificationPreferenceMap }
  >({
    mutationFn: async (input) => {
      const result = await updateNotificationPreferenceAction(input)
      if (!result.ok) throw new Error(result.error)
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_PREFS_KEY })
      const snapshot = queryClient.getQueryData<NotificationPreferenceMap>(
        NOTIFICATION_PREFS_KEY,
      )
      queryClient.setQueryData<NotificationPreferenceMap>(
        NOTIFICATION_PREFS_KEY,
        (prev) =>
          prev
            ? {
                ...prev,
                [input.category]: { inApp: input.inApp, email: input.email },
              }
            : prev,
      )
      return { snapshot }
    },
    onError: (error, _input, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(NOTIFICATION_PREFS_KEY, context.snapshot)
      }
      toast.error(error.message)
    },
    onSuccess: () => toast.success(t("saved")),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFS_KEY }),
  })
}
