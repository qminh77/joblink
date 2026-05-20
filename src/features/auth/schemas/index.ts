import { z } from "zod"

export const emailSchema = z
  .string()
  .min(1, "Vui lòng nhập email")
  .email("Email không hợp lệ")
  .max(255, "Email tối đa 255 ký tự")

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .max(72, "Mật khẩu tối đa 72 ký tự")

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
  remember: z.boolean(),
})

export const memberRegisterSchema = z.object({
  role: z.literal("member"),
  fullName: z
    .string()
    .min(2, "Họ tên tối thiểu 2 ký tự")
    .max(255, "Họ tên tối đa 255 ký tự"),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal<boolean>(true, {
    message: "Bạn cần đồng ý với điều khoản dịch vụ",
  }),
})

export const companyRegisterSchema = z.object({
  role: z.literal("company"),
  companyName: z
    .string()
    .min(2, "Tên công ty tối thiểu 2 ký tự")
    .max(255, "Tên công ty tối đa 255 ký tự"),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal<boolean>(true, {
    message: "Bạn cần đồng ý với điều khoản dịch vụ",
  }),
})

export const registerSchema = z.discriminatedUnion("role", [
  memberRegisterSchema,
  companyRegisterSchema,
])

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type MemberRegisterInput = z.infer<typeof memberRegisterSchema>
export type CompanyRegisterInput = z.infer<typeof companyRegisterSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
