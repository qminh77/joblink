import { Skeleton } from "@/components/ui/skeleton"

export default function EditJobLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <Skeleton className="h-[600px] w-full rounded-2xl" />
    </div>
  )
}
