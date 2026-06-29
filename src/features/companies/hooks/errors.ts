const FOLLOW_ERRORS = new Set([
  "invalidCompany",
  "unauthorized",
  "selfFollow",
  "companyNotFound",
  "notCompany",
  "companyInactive",
  "unknown",
])

const JOB_ACTION_ERRORS = new Set([
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

export function translateJobActionError(
  t: (key: string) => string,
  raw: string,
) {
  if (!raw) return t("unknown")
  if (JOB_ACTION_ERRORS.has(raw)) return t(raw)
  return raw
}
