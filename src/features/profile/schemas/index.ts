import { z } from "zod"

import { PROFILE_VISIBILITIES } from "@/features/profile/lib/constants"

type Translator = (key: string, values?: Record<string, string | number>) => string

function optionalUrl(t: Translator) {
  return z
    .string()
    .trim()
    .max(2048, t("urlInvalid"))
    .refine(
      (value) => value.length === 0 || /^https?:\/\/.+/i.test(value),
      t("urlInvalid"),
    )
}

function optionalText(max: number) {
  return z.string().trim().max(max)
}

function isoDate(t: Translator) {
  return z
    .string()
    .regex(/^\d{4}-\d{2}(-\d{2})?$/, t("startDateRequired"))
}

function optionalIsoDate() {
  return z
    .string()
    .refine((value) => value.length === 0 || /^\d{4}-\d{2}(-\d{2})?$/.test(value))
}

export function createMemberProfileSchema(t: Translator) {
  return z.object({
    fullName: z
      .string()
      .trim()
      .min(2, t("fullNameRequired"))
      .max(255, t("fullNameMax")),
    headline: optionalText(255),
    about: optionalText(4000),
    website: optionalUrl(t),
    provinceId: z.number().int().positive().nullable(),
    districtId: z.number().int().positive().nullable(),
    profileVisibility: z.enum(PROFILE_VISIBILITIES),
    openToWork: z.boolean(),
  })
}

export function createMemberExperienceSchema(t: Translator) {
  return z
    .object({
      id: z.number().int().positive().optional(),
      companyName: z
        .string()
        .trim()
        .min(1, t("companyNameRequired"))
        .max(255, t("companyNameMax")),
      position: z.string().trim().min(1, t("positionRequired")).max(255),
      startDate: isoDate(t),
      endDate: optionalIsoDate(),
      isCurrent: z.boolean(),
      description: optionalText(2000),
    })
    .refine(
      (value) => value.isCurrent || (value.endDate && value.endDate.length > 0),
      { message: t("endDateAfterStart"), path: ["endDate"] },
    )
}

export function createMemberEducationSchema(t: Translator) {
  return z.object({
    id: z.number().int().positive().optional(),
    schoolName: z.string().trim().min(1, t("schoolRequired")).max(255),
    degree: optionalText(160),
    fieldOfStudy: optionalText(160),
    startDate: optionalIsoDate(),
    endDate: optionalIsoDate(),
    description: optionalText(2000),
  })
}

export function createSkillNameSchema(t: Translator) {
  return z
    .string()
    .trim()
    .min(1, t("skillNameRequired"))
    .max(80, t("skillNameMax"))
}

export function createCompanyProfileSchema(t: Translator) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(2, t("companyNameRequired"))
      .max(255, t("companyNameMax")),
    about: optionalText(4000),
    logoUrl: optionalUrl(t),
    website: optionalUrl(t),
    industry: optionalText(160),
    size: optionalText(30),
    provinceId: z.number().int().positive().nullable(),
    districtId: z.number().int().positive().nullable(),
    openToHire: z.boolean(),
    businessAddress: optionalText(500),
    businessEmail: optionalText(255),
    representativeName: optionalText(255),
    representativeTitle: optionalText(160),
    taxId: optionalText(50),
  })
}

export type MemberProfileInput = z.infer<
  ReturnType<typeof createMemberProfileSchema>
>
export type MemberExperienceInput = z.infer<
  ReturnType<typeof createMemberExperienceSchema>
>
export type MemberEducationInput = z.infer<
  ReturnType<typeof createMemberEducationSchema>
>
export type CompanyProfileInput = z.infer<
  ReturnType<typeof createCompanyProfileSchema>
>
