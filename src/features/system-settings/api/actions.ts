"use server"

import { verifyRecaptcha, type RecaptchaVerifyResult } from "./recaptcha"

export async function verifyAuthRecaptchaAction(
  token: string | null,
  action: string,
): Promise<RecaptchaVerifyResult> {
  return verifyRecaptcha(token, action)
}
