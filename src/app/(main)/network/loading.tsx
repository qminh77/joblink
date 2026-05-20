import { Skeleton } from "@/components/ui/skeleton"

export default function NetworkLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
