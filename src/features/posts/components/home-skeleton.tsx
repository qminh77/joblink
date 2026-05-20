import { Card } from "@/components/ui/card"

function Block({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-muted/40 animate-pulse rounded-md ${className}`}
      aria-hidden
    />
  )
}

export function HomeSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="hidden lg:block lg:col-span-3 space-y-4">
        <Card className="bg-card border-border/40 rounded-2xl p-4 space-y-3">
          <Block className="h-16 w-16 rounded-full mx-auto" />
          <Block className="h-4 w-2/3 mx-auto" />
          <Block className="h-3 w-1/2 mx-auto" />
        </Card>
        <Card className="bg-card border-border/40 rounded-2xl p-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Block className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Block className="h-3 w-3/4" />
                <Block className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </Card>
      </aside>

      <div className="col-span-1 lg:col-span-6 space-y-4">
        <Card className="bg-card border-border/40 rounded-2xl p-4">
          <Block className="h-10 w-full rounded-full" />
        </Card>
        {[0, 1].map((i) => (
          <Card
            key={i}
            className="bg-card border-border/40 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <Block className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Block className="h-3 w-1/3" />
                <Block className="h-2 w-1/4" />
              </div>
            </div>
            <Block className="h-3 w-full" />
            <Block className="h-3 w-5/6" />
            <Block className="h-3 w-4/6" />
          </Card>
        ))}
      </div>

      <aside className="hidden lg:block col-span-1 lg:col-span-3">
        <Card className="bg-card border-border/40 rounded-2xl p-4 space-y-3">
          <Block className="h-4 w-1/3" />
          <Block className="h-10 w-full" />
          <Block className="h-10 w-full" />
        </Card>
      </aside>
    </div>
  )
}
