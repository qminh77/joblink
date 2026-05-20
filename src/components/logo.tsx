import Link from "next/link"

import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
  asLink?: boolean
  href?: string
}

const SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "w-8 h-8 text-[11px]",
  md: "w-14 h-14 text-base",
  lg: "w-20 h-20 text-xl",
}

export function Logo({
  className,
  size = "md",
  asLink = false,
  href = "/home",
}: LogoProps) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-500 text-white font-headline font-extrabold tracking-tight select-none shadow-sm shadow-primary/20",
        SIZE_CLASSES[size],
        className,
      )}
      aria-label="JobLink"
    >
      JL
    </span>
  )

  if (asLink) {
    return (
      <Link href={href} className="group inline-flex items-center gap-2">
        {content}
      </Link>
    )
  }

  return content
}
