import { z } from "zod"

import {
  POST_MAX_MEDIA_ITEMS,
  POST_VISIBILITIES,
  REACTION_TYPES,
} from "../lib/constants"

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string

export function createPostInputSchema(t: Translator) {
  return z
    .object({
      content: z
        .string({ error: t("contentRequired") })
        .trim()
        .max(3000, t("contentMax"))
        .default(""),
      visibility: z.enum(POST_VISIBILITIES).default("public"),
      mediaItems: z
        .array(
          z.object({
            url: z.string().url(),
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
          }),
        )
        .max(
          POST_MAX_MEDIA_ITEMS,
          t("tooManyImages", { max: POST_MAX_MEDIA_ITEMS }),
        )
        .optional()
        .default([]),
      sharedJob: z
        .object({
          id: z.number().int().positive(),
          title: z.string().trim().min(1),
          companyUserId: z.number().int().positive(),
          companyName: z.string().trim().min(1),
          companyLogoUrl: z.string().url().nullable(),
          companyVerified: z.boolean(),
          provinceName: z.string().nullable(),
          wardName: z.string().nullable(),
          jobTypeName: z.string().nullable(),
          workModeName: z.string().nullable(),
          salaryMin: z.number().nullable(),
          salaryMax: z.number().nullable(),
          salaryVisible: z.boolean(),
          createdAt: z.string().trim().min(1),
        })
        .optional(),
    })
    .refine(
      (d) =>
        d.content.length > 0 || d.mediaItems.length > 0 || Boolean(d.sharedJob),
      {
        message: t("contentOrMediaRequired"),
        path: ["content"],
      },
    )
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
      visibility: z.enum(POST_VISIBILITIES),
      // undefined → giữ nguyên ảnh hiện tại; array (kể cả rỗng) → thay thế.
      mediaItems: z
        .array(
          z.object({
            url: z.string().url(),
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
          }),
        )
        .max(
          POST_MAX_MEDIA_ITEMS,
          t("tooManyImages", { max: POST_MAX_MEDIA_ITEMS }),
        )
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

export type ShareInput = z.infer<ReturnType<typeof createShareInputSchema>>
