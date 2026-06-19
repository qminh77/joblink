import type { QueryClient } from "@tanstack/react-query"

import { MESSAGING_OVERVIEW_KEY, MESSAGING_UNREAD_KEY } from "./keys"

export function invalidateMessaging(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: MESSAGING_OVERVIEW_KEY })
  qc.invalidateQueries({ queryKey: MESSAGING_UNREAD_KEY })
}
