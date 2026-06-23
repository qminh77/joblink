import { z } from "zod"

type Translator = (key: string) => string

export function createCompanyUserIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidCompany") })
    .int()
    .positive(t("invalidCompany"))
}

const JOB_STATUSES_SETTABLE = ["draft", "active", "closed"] as const

export function createJobStatusUpdateSchema(t: Translator) {
  return z.object({
    jobId: z.number({ error: t("invalidJob") }).int().positive(t("invalidJob")),
    newStatus: z.enum(JOB_STATUSES_SETTABLE, { error: t("invalidStatus") }),
  })
}
