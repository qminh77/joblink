import { z } from "zod"

type Translator = (key: string) => string

const POST_VISIBILITY = ["public", "connections", "private"] as const
const REACTION_TYPES = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
] as const

export function createPostInputSchema(t: Translator) {
  return z
    .object({
      content: z
        .string({ error: t("contentRequired") })
        .trim()
        .max(3000, t("contentMax"))
        .default(""),
      visibility: z.enum(POST_VISIBILITY).default("public"),
      mediaUrl: z.string().url().optional(),
    })
    .refine((d) => d.content.length > 0 || !!d.mediaUrl, {
      message: t("contentOrMediaRequired"),
      path: ["content"],
    })
}

export type PostInput = z.infer<ReturnType<typeof createPostInputSchema>>

export function createPostUpdateSchema(t: Translator) {
  return z.object({
    postId: z.number({ error: t("invalidPost") }).int().positive(t("invalidPost")),
    content: z
      .string({ error: t("contentRequired") })
      .trim()
      .min(1, t("contentRequired"))
      .max(3000, t("contentMax")),
    visibility: z.enum(POST_VISIBILITY),
  })
}

export type PostUpdateInput = z.infer<ReturnType<typeof createPostUpdateSchema>>

export function createPostIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidPost") })
    .int()
    .positive(t("invalidPost"))
}

export function createReactionInputSchema(t: Translator) {
  return z.object({
    postId: createPostIdSchema(t),
    reactionType: z.enum(REACTION_TYPES).default("like"),
  })
}

export function createCommentInputSchema(t: Translator) {
  return z.object({
    postId: createPostIdSchema(t),
    parentId: z.number().int().positive().nullable().optional(),
    content: z
      .string({ error: t("contentRequired") })
      .trim()
      .min(1, t("contentRequired"))
      .max(2000, t("contentMax")),
  })
}

export type CommentInput = z.infer<ReturnType<typeof createCommentInputSchema>>

export function createCommentIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidComment") })
    .int()
    .positive(t("invalidComment"))
}

export function createShareInputSchema(t: Translator) {
  return z.object({
    postId: createPostIdSchema(t),
    commentContent: z
      .string()
      .trim()
      .max(2000, t("contentMax"))
      .nullable()
      .optional(),
  })
}

export type ShareInput = z.infer<ReturnType<typeof createShareInputSchema>>
