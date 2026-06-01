import { z } from "zod"

export const userActionSchema = z.object({
  userId: z.coerce.number().int().positive(),
  action: z.enum(["suspend", "ban", "restore"]),
  reason: z.string().trim().min(1).max(500),
})

export type UserActionInput = z.infer<typeof userActionSchema>

export const companyActionSchema = z.object({
  userId: z.coerce.number().int().positive(),
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  note: z.string().trim().max(500).optional().nullable(),
})

export type CompanyActionInput = z.infer<typeof companyActionSchema>

export const moderationActionSchema = z.object({
  reportId: z.coerce.number().int().positive(),
  actionType: z.enum([
    "hide",
    "delete",
    "warn",
    "suspend",
    "ban",
    "restore",
    "dismiss",
  ]),
  reason: z.string().trim().min(1).max(500),
})

export type ModerationActionInput = z.infer<typeof moderationActionSchema>

export const jobActionSchema = z.object({
  jobId: z.coerce.number().int().positive(),
  action: z.enum(["remove", "restore"]),
  reason: z.string().trim().min(1).max(500),
})

export type JobActionInput = z.infer<typeof jobActionSchema>

export const appealActionSchema = z.object({
  appealId: z.coerce.number().int().positive(),
  action: z.enum(["accept", "reject"]),
  note: z.string().trim().max(500).optional().nullable(),
})

export type AppealActionInput = z.infer<typeof appealActionSchema>

export const reportStatusSchema = z.object({
  reportId: z.coerce.number().int().positive(),
  status: z.enum(["pending", "in_review", "resolved", "dismissed"]),
})

export const settingsUpdateSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
)

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>

export const LOOKUP_KINDS = [
  "provinces",
  "wards",
  "job_types",
  "work_modes",
  "job_positions",
  "report_types",
  "skills",
] as const

const lookupKindEnum = z.enum(LOOKUP_KINDS)

// skills is minimal (id + name) — so code/nameEn/sortOrder/isActive optional in raw input.
export const lookupCreateSchema = z
  .object({
    kind: lookupKindEnum,
    code: z.string().trim().max(60).optional().nullable(),
    name: z.string().trim().min(1).max(160),
    nameEn: z.string().trim().max(160).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).max(99999).optional().default(0),
    isActive: z.coerce.boolean().optional().default(true),
    provinceId: z.coerce.number().int().positive().nullable().optional(),
    parentId: z.coerce.number().int().positive().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind !== "skills") {
      if (!val.code || val.code.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["code"],
          message: "code_required",
        })
      }
    }
    if (val.kind === "wards" && !val.provinceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provinceId"],
        message: "province_required",
      })
    }
  })

export const lookupUpdateSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    kind: lookupKindEnum,
    code: z.string().trim().max(60).optional().nullable(),
    name: z.string().trim().min(1).max(160),
    nameEn: z.string().trim().max(160).nullable().optional(),
    sortOrder: z.coerce.number().int().min(0).max(99999).optional().default(0),
    isActive: z.coerce.boolean().optional().default(true),
    provinceId: z.coerce.number().int().positive().nullable().optional(),
    parentId: z.coerce.number().int().positive().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind !== "skills") {
      if (!val.code || val.code.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["code"],
          message: "code_required",
        })
      }
    }
    if (val.kind === "wards" && !val.provinceId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["provinceId"],
        message: "province_required",
      })
    }
  })

export const lookupDeleteSchema = z.object({
  kind: lookupKindEnum,
  id: z.coerce.number().int().positive(),
})
