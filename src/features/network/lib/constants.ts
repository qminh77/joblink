export const CONNECTION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "blocked",
] as const
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number]
