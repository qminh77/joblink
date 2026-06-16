import { z } from "zod"

import { NOTIFICATION_CATEGORIES } from "../lib/preferences"

export const updateNotificationPreferenceSchema = z.object({
  category: z.enum(NOTIFICATION_CATEGORIES),
  inApp: z.boolean(),
  email: z.boolean(),
})

export type UpdateNotificationPreferenceInput = z.infer<
  typeof updateNotificationPreferenceSchema
>
