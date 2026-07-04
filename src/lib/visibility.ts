export const AUDIENCE_VISIBILITIES = [
  "public",
  "connections",
  "private",
] as const
export type AudienceVisibility = (typeof AUDIENCE_VISIBILITIES)[number]
