import { Skeleton } from "@/components/ui/skeleton"

export default function JobDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
