"use client"

import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <Card className="p-8 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
        <Icon className="size-6 text-muted-foreground/60" />
      </div>
      <h3 className="font-headline font-bold text-base text-foreground">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  )
}
