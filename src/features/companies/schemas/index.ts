import { z } from "zod"

type Translator = (key: string) => string

export function createCompanyUserIdSchema(t: Translator) {
  return z
    .number({ error: t("invalidCompany") })
    .int()
    .positive(t("invalidCompany"))
}
