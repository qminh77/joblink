import { Skeleton } from "@/components/ui/skeleton"

export default function AdminReportsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-2xl" />
    </div>
  )
}
