import { Card } from "@/components/ui/card"

export function SectionCard({
  title,
  icon,
  children,
  empty,
  emptyMessage,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  empty?: boolean
  emptyMessage?: string
}) {
  return (
    <Card className="rounded-2xl bg-card border-border/40 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-headline font-bold text-base text-foreground">
          {title}
        </h2>
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        children
      )}
    </Card>
  )
}
