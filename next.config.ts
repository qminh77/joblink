import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const supabaseUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
  } catch {
    return null
  }
})()

const remotePatterns: Array<{
  protocol: "http" | "https"
  hostname: string
  port?: string
  pathname?: string
}> = []

if (supabaseUrl) {
  remotePatterns.push({
    protocol: supabaseUrl.protocol.replace(':', '') as "http" | "https",
    hostname: supabaseUrl.hostname,
    port: supabaseUrl.port || '',
    pathname: "/storage/v1/object/public/**",
  })
}

// Luôn cho phép host của production (để load ảnh cũ khi sync data về local)
remotePatterns.push({
  protocol: "https",
  hostname: "awetfafplorxlmdifkqd.supabase.co",
  pathname: "/storage/v1/object/public/**",
})

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.12.0.116", "localhost", "127.0.0.1"],
  images: {
    remotePatterns,
    // Ảnh post đã được resize client-side ≤ 1920px nên không cần size lớn hơn.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1920],
    formats: ["image/avif", "image/webp"],
  },
}

export default withNextIntl(nextConfig)
