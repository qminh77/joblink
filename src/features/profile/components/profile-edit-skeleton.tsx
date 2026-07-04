import { Skeleton } from "@/components/ui/skeleton"

export function ProfileEditSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  )
}
