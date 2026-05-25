import { z } from "zod"

type Translator = (key: string) => string

export const MESSAGE_MAX_LENGTH = 4000

export function createSendMessageSchema(t: Translator) {
  return z.object({
    conversationId: z
      .number({ error: t("invalidConversation") })
      .int()
      .positive(t("invalidConversation")),
    content: z
      .string()
      .trim()
      .min(1, t("emptyContent"))
      .max(MESSAGE_MAX_LENGTH, t("tooLong")),
  })
}

export function createConversationIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidConversation") })
    .int()
    .positive(t("invalidConversation"))
}

export function createTargetUserIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidUser") })
    .int()
    .positive(t("invalidUser"))
}
