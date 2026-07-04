const FOLLOW_ERRORS = new Set([
  "invalidCompany",
  "unauthorized",
  "selfFollow",
  "companyNotFound",
  "notCompany",
  "companyInactive",
  "unknown",
])

const VERIFICATION_ERRORS = new Set([
  "unauthorized",
  "notResubmittable",
  "companyNotFound",
  "notCompany",
  "unknown",
])

export function translateFollowError(
  t: (key: string) => string,
  raw: string | undefined,
) {
  if (!raw) return t("unknown")
  if (FOLLOW_ERRORS.has(raw)) return t(raw)
  return raw
}

export function translateVerificationError(
  t: (key: string) => string,
  raw: string,
) {
  if (!raw) return t("unknown")
  if (VERIFICATION_ERRORS.has(raw)) return t(raw)
  return raw
}
