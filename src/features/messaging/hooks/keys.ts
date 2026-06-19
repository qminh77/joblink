export const MESSAGING_OVERVIEW_KEY = ["messaging", "overview"] as const
export const MESSAGING_UNREAD_KEY = ["messaging", "unread"] as const
export const MESSAGING_MESSAGES_KEY = (conversationId: number) =>
  ["messaging", "messages", conversationId] as const
