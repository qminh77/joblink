import { Skeleton } from "@/components/ui/skeleton"

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-80 space-y-2">
        <Skeleton className="h-14 w-full rounded-2xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <Skeleton className="h-16 w-full rounded-t-2xl" />
        <Skeleton className="flex-1 w-full rounded-b-2xl" />
      </div>
    </div>
  )
}
