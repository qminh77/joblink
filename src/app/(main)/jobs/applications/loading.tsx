import { Skeleton } from "@/components/ui/skeleton"

export default function MyApplicationsLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="pb-2 border-b border-border/40">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg mt-2" />
      </div>
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-2xl" />
      ))}
    </div>
  )
}
