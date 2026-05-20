import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import { Providers } from "@/providers"
import { siteConfig } from "@/config/site"

import "./globals.css"

const fontBody = Inter({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
})

const fontHeadline = Manrope({
  variable: "--font-headline",
  subsets: ["latin", "vietnamese"],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${fontBody.variable} ${fontHeadline.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
