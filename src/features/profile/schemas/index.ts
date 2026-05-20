import { z } from "zod"

import { PROFILE_VISIBILITIES } from "@/features/profile/lib/constants"

const optionalUrl = z
  .string()
  .trim()
  .max(2048, "URL quá dài")
  .refine(
    (value) => value.length === 0 || /^https?:\/\/.+/i.test(value),
    "URL phải bắt đầu bằng http(s)://",
  )
  .optional()
  .default("")

const optionalText = (max: number) =>
  z.string().trim().max(max, `Tối đa ${max} ký tự`).optional().default("")

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}(-\d{2})?$/, "Ngày không hợp lệ (YYYY-MM hoặc YYYY-MM-DD)")

const optionalIsoDate = z
  .string()
  .refine(
    (value) =>
      value.length === 0 || /^\d{4}-\d{2}(-\d{2})?$/.test(value),
    "Ngày không hợp lệ",
  )
  .optional()
  .default("")

export const memberProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ tên tối thiểu 2 ký tự")
    .max(255, "Họ tên tối đa 255 ký tự"),
  headline: optionalText(255),
  about: optionalText(4000),
  avatarUrl: optionalUrl,
  website: optionalUrl,
  provinceId: z.number().int().positive().nullable().optional(),
  districtId: z.number().int().positive().nullable().optional(),
  profileVisibility: z.enum(PROFILE_VISIBILITIES),
  openToWork: z.boolean(),
})

export type MemberProfileInput = z.infer<typeof memberProfileSchema>

export const memberExperienceSchema = z
  .object({
    id: z.number().int().positive().optional(),
    companyName: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên công ty")
      .max(255, "Tên công ty tối đa 255 ký tự"),
    position: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập vị trí")
      .max(255, "Vị trí tối đa 255 ký tự"),
    startDate: isoDate,
    endDate: optionalIsoDate,
    isCurrent: z.boolean(),
    description: optionalText(2000),
  })
  .refine(
    (value) => value.isCurrent || (value.endDate && value.endDate.length > 0),
    {
      message: "Vui lòng nhập ngày kết thúc hoặc đánh dấu đang làm việc",
      path: ["endDate"],
    },
  )

export type MemberExperienceInput = z.infer<typeof memberExperienceSchema>

export const memberEducationSchema = z.object({
  id: z.number().int().positive().optional(),
  schoolName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên trường")
    .max(255, "Tên trường tối đa 255 ký tự"),
  degree: optionalText(160),
  fieldOfStudy: optionalText(160),
  startDate: optionalIsoDate,
  endDate: optionalIsoDate,
  description: optionalText(2000),
})

export type MemberEducationInput = z.infer<typeof memberEducationSchema>

export const skillNameSchema = z
  .string()
  .trim()
  .min(1, "Vui lòng nhập kỹ năng")
  .max(100, "Kỹ năng tối đa 100 ký tự")

export const companyProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên công ty tối thiểu 2 ký tự")
    .max(255, "Tên công ty tối đa 255 ký tự"),
  about: optionalText(4000),
  logoUrl: optionalUrl,
  website: optionalUrl,
  industry: optionalText(160),
  size: optionalText(30),
  provinceId: z.number().int().positive().nullable().optional(),
  districtId: z.number().int().positive().nullable().optional(),
  openToHire: z.boolean(),
  businessAddress: optionalText(500),
  businessEmail: optionalText(255),
  representativeName: optionalText(255),
  representativeTitle: optionalText(160),
  taxId: optionalText(50),
})

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>
