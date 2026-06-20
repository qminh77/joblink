export const siteConfig = {
  name: "Joblink",
  description: "Mạng xã hội việc làm và tuyển dụng ",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale: {
    default: "vi",
    available: ["vi", "en"] as const,
  },
  links: {
    github: "",
  },
} as const

export type SiteConfig = typeof siteConfig
