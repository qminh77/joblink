"use client"

import { Clock, Shield, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { AdminAuditLogEntry } from "@/features/admin/types"
import { ActionIcon } from "./action-icon"
import { DiffViewer } from "./diff-viewer"
import { formatActionLabel, relativeTime } from "./utils"

export function AuditEntryRow({ entry }: { entry: AdminAuditLogEntry }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
      <div className="mt-0.5">
        <ActionIcon action={entry.action} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {entry.actorId ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
              <User className="w-3 h-3 text-muted-foreground" />
              {entry.actorName ?? entry.actorEmail ?? `#${entry.actorId}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <Shield className="w-3 h-3" />
              system
            </span>
          )}
          <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">
            {formatActionLabel(entry.action)}
          </Badge>
          {entry.entityType ? (
            <span className="text-xs text-muted-foreground">
              {entry.entityType}
              {entry.entityId != null ? `#${entry.entityId}` : ""}
            </span>
          ) : null}
          {entry.reason ? (
            <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
              &ldquo;{entry.reason}&rdquo;
            </span>
          ) : null}
        </div>
        <DiffViewer oldData={entry.oldData} newData={entry.newData} />
      </div>
      <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
        <Clock className="w-3 h-3" />
        <span title={new Date(entry.createdAt).toLocaleString()}>
          {relativeTime(entry.createdAt)}
        </span>
        {entry.ipAddress ? (
          <span className="hidden sm:inline text-[10px]">{entry.ipAddress}</span>
        ) : null}
      </div>
    </div>
  )
}
