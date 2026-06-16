import { z } from "zod"

import { REPORT_TARGET_TYPES } from "@/lib/constants"

type Translator = (key: string) => string

export function createReportSchema(t: Translator) {
  return z.object({
    targetType: z.enum(REPORT_TARGET_TYPES, {
      error: t("invalidTarget"),
    }),
    targetId: z
      .number({ error: t("invalidTarget") })
      .int()
      .positive(t("invalidTarget")),
    reason: z
      .string({ error: t("reasonRequired") })
      .trim()
      .min(1, t("reasonRequired"))
      .max(80, t("reasonMax")),
    description: z
      .string()
      .trim()
      .max(500, t("descriptionMax"))
      .nullable()
      .optional(),
  })
}

export type ReportInput = z.infer<ReturnType<typeof createReportSchema>>

export function createAppealSchema(t: Translator) {
  return z.object({
    moderationActionId: z
      .number({ error: t("invalidAction") })
      .int()
      .positive(t("invalidAction")),
    reason: z
      .string({ error: t("appealReasonRequired") })
      .trim()
      .min(1, t("appealReasonRequired"))
      .max(500, t("appealReasonMax")),
  })
}

export type AppealInput = z.infer<ReturnType<typeof createAppealSchema>>
