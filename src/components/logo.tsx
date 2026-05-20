import Link from "next/link"

import { cn } from "@/lib/utils"

type LogoProps = {
  className?: string
  size?: "sm" | "md" | "lg"
  asLink?: boolean
  href?: string
}

const SIZE_CLASSES: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
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
        "inline-flex items-center font-headline font-bold tracking-tight select-none text-foreground",
        SIZE_CLASSES[size],
        className,
      )}
      aria-label="JobLink"
    >
      JobLink
    </span>
  )

  if (asLink) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
