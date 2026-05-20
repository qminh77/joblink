import { Skeleton } from "@/components/ui/skeleton"

export default function AdminUsersLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-2xl" />
    </div>
  )
}
