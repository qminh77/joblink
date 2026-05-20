import { Skeleton } from "@/components/ui/skeleton"

export function NetworkSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-6">
      {/* Title and subtitle */}
      <div>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg mt-2" />
      </div>

      {/* Search input */}
      <Skeleton className="h-10 w-full rounded-xl" />

      {/* Tabs */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Tab content - Suggestions grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
