import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname
  } catch {
    return ""
  }
})()

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.12.0.116", "localhost", "127.0.0.1"],
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    // Ảnh post đã được resize client-side ≤ 1920px nên không cần size lớn hơn.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    formats: ["image/avif", "image/webp"],
  },
}

export default withNextIntl(nextConfig)
