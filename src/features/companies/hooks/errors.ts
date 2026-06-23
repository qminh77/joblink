const FOLLOW_ERRORS = new Set([
  "invalidCompany",
  "unauthorized",
  "selfFollow",
  "companyNotFound",
  "notCompany",
  "companyInactive",
  "unknown",
])

const DASHBOARD_ERRORS = new Set([
  "unauthorized",
  "invalidStatus",
  "jobNotFound",
  "invalidJob",
  "noteTooLong",
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

export function translateDashboardError(
  t: (key: string) => string,
  raw: string,
) {
  if (!raw) return t("unknown")
  if (DASHBOARD_ERRORS.has(raw)) return t(raw)
  return raw
}
