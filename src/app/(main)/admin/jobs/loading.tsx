import { Skeleton } from "@/components/ui/skeleton"

export default function AdminJobsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72 rounded-lg" />
      <Skeleton className="h-10 w-full max-w-xl rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-2xl" />
    </div>
  )
}
