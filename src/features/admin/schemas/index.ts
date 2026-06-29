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

export const reportStatusSchema = z.object({
  reportId: z.coerce.number().int().positive(),
  status: z.enum(["pending", "in_review", "resolved", "dismissed"]),
})

export const postActionSchema = z.object({
  postId: z.coerce.number().int().positive(),
  action: z.enum(["hide", "restore", "delete"]),
  reason: z.string().trim().min(1).max(500),
})

export type PostActionInput = z.infer<typeof postActionSchema>
