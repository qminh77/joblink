import { z } from "zod"

type Translator = (key: string) => string

export function createEmailSchema(t: Translator) {
  return z
    .string()
    .min(1, t("emailRequired"))
    .email(t("emailInvalid"))
    .max(255, t("emailTooLong"))
}

export function createPasswordSchema(t: Translator) {
  return z
    .string()
    .min(8, t("passwordMin"))
    .max(72, t("passwordMax"))
}

export function createLoginSchema(t: Translator) {
  return z.object({
    email: createEmailSchema(t),
    password: z.string().min(1, t("passwordRequired")),
    remember: z.boolean(),
  })
}

export function createMemberRegisterSchema(t: Translator) {
  return z.object({
    role: z.literal("member"),
    fullName: z
      .string()
      .min(2, t("fullNameMin"))
      .max(255, t("fullNameMax")),
    email: createEmailSchema(t),
    password: createPasswordSchema(t),
    acceptTerms: z.literal<boolean>(true, { message: t("termsRequired") }),
  })
}

export function createCompanyRegisterSchema(t: Translator) {
  return z.object({
    role: z.literal("company"),
    companyName: z
      .string()
      .min(2, t("companyNameMin"))
      .max(255, t("companyNameMax")),
    email: createEmailSchema(t),
    password: createPasswordSchema(t),
    acceptTerms: z.literal<boolean>(true, { message: t("termsRequired") }),
  })
}

export function createRegisterSchema(t: Translator) {
  return z.discriminatedUnion("role", [
    createMemberRegisterSchema(t),
    createCompanyRegisterSchema(t),
  ])
}

export function createForgotPasswordSchema(t: Translator) {
  return z.object({
    email: createEmailSchema(t),
  })
}

const noop: Translator = (k) => k
export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>
export type MemberRegisterInput = z.infer<
  ReturnType<typeof createMemberRegisterSchema>
>
export type CompanyRegisterInput = z.infer<
  ReturnType<typeof createCompanyRegisterSchema>
>
export type ForgotPasswordInput = z.infer<
  ReturnType<typeof createForgotPasswordSchema>
>
void noop
