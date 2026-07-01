"use client"

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term))
}

export function ActionIcon({ action }: { action: string }) {
  if (includesAny(action, ["delete", "remove", "ban", "suspend"])) {
    return <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
  }
  if (includesAny(action, ["create", "add", "register", "send"])) {
    return <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
  }
  if (includesAny(action, ["update", "edit", "rename"])) {
    return <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
  }
  if (includesAny(action, ["restore", "unblock", "accept"])) {
    return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
  }
  return <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
}
