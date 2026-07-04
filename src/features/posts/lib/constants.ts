import { AUDIENCE_VISIBILITIES } from "@/lib/visibility"

export const POST_TYPES = ["text", "image", "video", "article"] as const
export type PostType = (typeof POST_TYPES)[number]

export const POST_VISIBILITIES = AUDIENCE_VISIBILITIES
export type PostVisibility = (typeof POST_VISIBILITIES)[number]

export const REACTION_TYPES = [
  "like",
  "celebrate",
  "support",
  "love",
  "insightful",
  "funny",
] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export const POST_MAX_MEDIA_ITEMS = 10
