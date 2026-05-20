import { AuthError } from "@supabase/supabase-js"

type Translator = (key: string) => string

const CODE_TO_KEY: Record<string, string> = {
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  user_already_exists: "userAlreadyExists",
  user_not_found: "userNotFound",
  weak_password: "weakPassword",
  over_email_send_rate_limit: "rateLimit",
  same_password: "samePassword",
}

export function getAuthErrorMessage(
  error: unknown,
  t: Translator,
  tCommon: Translator,
): string {
  if (error instanceof AuthError) {
    const code = error.code ?? ""
    if (code && CODE_TO_KEY[code]) return t(CODE_TO_KEY[code])

    const message = error.message.toLowerCase()
    if (message.includes("invalid login")) return t("invalidCredentials")
    if (message.includes("already registered")) return t("userAlreadyExists")
    if (message.includes("email rate limit")) return t("rateLimit")
    return error.message
  }

  if (error instanceof Error) return error.message
  return tCommon("unknownError")
}
