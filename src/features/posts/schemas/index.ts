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

const MAX_MEDIA_ITEMS = 10

export function createPostInputSchema(t: Translator) {
  return z
    .object({
      content: z
        .string({ error: t("contentRequired") })
        .trim()
        .max(3000, t("contentMax"))
        .default(""),
      visibility: z.enum(POST_VISIBILITY).default("public"),
      mediaItems: z
        .array(
          z.object({
            url: z.string().url(),
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
          }),
        )
        .max(MAX_MEDIA_ITEMS, t("tooManyImages"))
        .optional()
        .default([]),
    })
    .refine((d) => d.content.length > 0 || d.mediaItems.length > 0, {
      message: t("contentOrMediaRequired"),
      path: ["content"],
    })
}

export type PostInput = z.infer<ReturnType<typeof createPostInputSchema>>

export function createPostUpdateSchema(t: Translator) {
  return z
    .object({
      postId: z
        .number({ error: t("invalidPost") })
        .int()
        .positive(t("invalidPost")),
      content: z
        .string({ error: t("contentRequired") })
        .trim()
        .max(3000, t("contentMax"))
        .default(""),
      visibility: z.enum(POST_VISIBILITY),
      // undefined → giữ nguyên ảnh hiện tại; array (kể cả rỗng) → thay thế.
      mediaItems: z
        .array(
          z.object({
            url: z.string().url(),
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
          }),
        )
        .max(MAX_MEDIA_ITEMS, t("tooManyImages"))
        .optional(),
    })
    .refine(
      (d) => {
        // Khi caller chủ động set mediaItems (mảng) → cần content HOẶC media.
        if (d.mediaItems !== undefined) {
          return d.content.length > 0 || d.mediaItems.length > 0
        }
        // Không đụng media → vẫn cần content (vì không biết media cũ có không).
        return d.content.length > 0
      },
      { message: t("contentOrMediaRequired"), path: ["content"] },
    )
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

export function createPollInputSchema(t: Translator) {
  return z
    .object({
      content: z
        .string({ error: t("contentRequired") })
        .trim()
        .max(3000, t("contentMax"))
        .default(""),
      visibility: z.enum(POST_VISIBILITY).default("public"),
      options: z
        .array(
          z
            .string({ error: t("optionRequired") })
            .trim()
            .min(1, t("optionRequired"))
            .max(255, t("optionMax")),
        )
        .min(2, t("minOptions"))
        .max(10, t("maxOptions")),
    })
    .refine(
      (d) => d.content.length > 0 || d.options.length >= 2,
      { message: t("contentOrMediaRequired"), path: ["content"] },
    )
}

export type PollInput = z.infer<ReturnType<typeof createPollInputSchema>>

export function createVoteInputSchema(t: Translator) {
  return z.object({
    postId: createPostIdSchema(t),
    optionId: z
      .number({ error: t("invalidOption") })
      .int()
      .positive(t("invalidOption")),
  })
}

export type VoteInput = z.infer<ReturnType<typeof createVoteInputSchema>>

export function createUpdatePollSchema(t: Translator) {
  return z.object({
    postId: createPostIdSchema(t),
    content: z
      .string({ error: t("contentRequired") })
      .trim()
      .max(3000, t("contentMax"))
      .default(""),
    visibility: z.enum(POST_VISIBILITY),
    options: z
      .array(
        z.object({
          id: z.number().int().positive().optional(),
          optionText: z
            .string()
            .trim()
            .min(1, t("optionRequired"))
            .max(255, t("optionMax")),
        }),
      )
      .min(2, t("minOptions"))
      .max(10, t("maxOptions")),
  })
}

export type UpdatePollInput = z.infer<ReturnType<typeof createUpdatePollSchema>>

export type ShareInput = z.infer<ReturnType<typeof createShareInputSchema>>
