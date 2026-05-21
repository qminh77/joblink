import { z } from "zod"

type Translator = (key: string) => string

export function createTargetUserIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidUser") })
    .int()
    .positive(t("invalidUser"))
}

export function createConnectionIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidConnection") })
    .int()
    .positive(t("invalidConnection"))
}
