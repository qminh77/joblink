"use client"

import { lazy, Suspense } from "react"
import { ThemeProvider } from "next-themes"
import { TooltipProvider } from "@/components/ui/tooltip"

import { QueryProvider } from "./query-provider"

const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Suspense fallback={null}>
          <Toaster richColors closeButton position="top-right" />
        </Suspense>
      </QueryProvider>
    </ThemeProvider>
  )
}
