import { z } from "zod"

type Translator = (key: string) => string

const MAX_TITLE = 255
const MAX_DESCRIPTION = 20_000
const MAX_REQUIREMENTS = 10_000
const MAX_COVER_LETTER = 5000

export function createJobSchema(t: Translator) {
  return z
    .object({
      title: z
        .string()
        .trim()
        .min(3, t("titleRequired"))
        .max(MAX_TITLE, t("titleTooLong")),
      description: z
        .string()
        .trim()
        .min(10, t("descriptionRequired"))
        .max(MAX_DESCRIPTION, t("descriptionTooLong")),
      requirements: z
        .string()
        .trim()
        .max(MAX_REQUIREMENTS, t("requirementsTooLong"))
        .optional()
        .nullable(),
      provinceId: z.number().int().positive().optional().nullable(),
      districtId: z.number().int().positive().optional().nullable(),
      salaryMin: z.number().int().nonnegative().optional().nullable(),
      salaryMax: z.number().int().nonnegative().optional().nullable(),
      salaryVisible: z.boolean().default(true),
      jobTypeId: z
        .number({ error: t("jobTypeRequired") })
        .int()
        .positive(t("jobTypeRequired")),
      workModeId: z
        .number({ error: t("workModeRequired") })
        .int()
        .positive(t("workModeRequired")),
      positionTitle: z
        .string()
        .trim()
        .max(MAX_TITLE, t("positionTitleTooLong"))
        .optional()
        .nullable(),
      status: z.enum(["draft", "active"]),
      expiresAt: z.string().datetime().optional().nullable(),
      skills: z
        .array(z.string().trim().min(1).max(100))
        .max(20, t("tooManySkills"))
        .optional(),
    })
    .refine(
      (v) =>
        v.salaryMin == null ||
        v.salaryMax == null ||
        v.salaryMin <= v.salaryMax,
      { message: t("invalidSalaryRange"), path: ["salaryMax"] },
    )
}

export function createApplySchema(t: Translator) {
  return z.object({
    jobId: z.number({ error: t("invalidJob") }).int().positive(t("invalidJob")),
    coverLetter: z
      .string()
      .trim()
      .max(MAX_COVER_LETTER, t("coverLetterTooLong"))
      .optional()
      .nullable(),
    // CV chọn từ danh sách member_cvs. Server lookup storage_path từ id rồi
    // pass vào RPC apply_to_job như p_resume_url (giữ shape RPC cũ).
    resumeCvId: z
      .number({ error: t("resumeRequired") })
      .int()
      .positive(t("resumeRequired")),
  })
}

export function createJobIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidJob") })
    .int()
    .positive(t("invalidJob"))
}

export function createApplicationIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidApplication") })
    .int()
    .positive(t("invalidApplication"))
}
