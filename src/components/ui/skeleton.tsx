import { cn } from "@/lib/utils"

const shimmerStyles =
  "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent dark:before:via-white/10"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-muted",
        shimmerStyles,
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
