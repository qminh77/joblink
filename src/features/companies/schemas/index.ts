import { z } from "zod"

type Translator = (key: string) => string

export function createCompanyUserIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidCompany") })
    .int()
    .positive(t("invalidCompany"))
}

const APP_STATUSES = [
  "applied",
  "reviewed",
  "interview",
  "offered",
  "hired",
  "rejected",
] as const

const JOB_STATUSES_SETTABLE = ["draft", "active", "closed"] as const

export function createApplicationStatusUpdateSchema(t: Translator) {
  return z.object({
    applicationId: z
      .number({ error: t("invalidApplication") })
      .int()
      .positive(t("invalidApplication")),
    newStatus: z.enum(APP_STATUSES, { error: t("invalidStatus") }),
    note: z.string().trim().max(2000, t("noteTooLong")).optional().nullable(),
  })
}

export function createJobStatusUpdateSchema(t: Translator) {
  return z.object({
    jobId: z.number({ error: t("invalidJob") }).int().positive(t("invalidJob")),
    newStatus: z.enum(JOB_STATUSES_SETTABLE, { error: t("invalidStatus") }),
  })
}
