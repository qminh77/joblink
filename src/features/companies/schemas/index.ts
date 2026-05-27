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

export function createScheduleInterviewSchema(t: Translator) {
  return z.object({
    applicationId: z
      .number({ error: t("invalidApplication") })
      .int()
      .positive(t("invalidApplication")),
    // ISO datetime; phải là thời điểm trong tương lai.
    scheduledAt: z
      .string({ error: t("invalidScheduleTime") })
      .refine((v) => {
        const ts = Date.parse(v)
        return Number.isFinite(ts) && ts > Date.now()
      }, t("invalidScheduleTime")),
    durationMinutes: z
      .number({ error: t("invalidDuration") })
      .int()
      .min(15, t("invalidDuration"))
      .max(480, t("invalidDuration")),
    locationOrLink: z
      .string()
      .trim()
      .max(500, t("locationTooLong"))
      .optional()
      .nullable(),
    note: z.string().trim().max(2000, t("noteTooLong")).optional().nullable(),
  })
}

export type ScheduleInterviewInput = {
  applicationId: number
  scheduledAt: string
  durationMinutes: number
  locationOrLink?: string | null
  note?: string | null
}
