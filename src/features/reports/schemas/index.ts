import { z } from "zod"

import { REPORT_TARGET_TYPES } from "@/features/reports/lib/constants"

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
