const KNOWN_ERRORS = new Set([
  "unauthorized",
  "memberOnly",
  "notCompany",
  "companyInactive",
  "jobNotFound",
  "jobNotActive",
  "jobExpired",
  "alreadyApplied",
  "coverLetterTooLong",
  "invalidJob",
  "invalidApplication",
  "applicationNotFound",
  "notOwner",
  "cannotWithdrawNow",
  "invalidTitle",
  "titleTooLong",
  "invalidDescription",
  "invalidSalaryRange",
  "invalidStatus",
  "invalidJobType",
  "invalidWorkMode",
  "invalidProvince",
  "invalidResumeUrl",
  "tooManySkills",
  "titleRequired",
  "descriptionRequired",
  "descriptionTooLong",
  "requirementsTooLong",
  "jobTypeRequired",
  "workModeRequired",
  "unknown",
])

export function translateJobsError(t: (key: string) => string, raw: string) {
  if (!raw) return t("unknown")
  if (KNOWN_ERRORS.has(raw)) return t(raw)
  return raw
}
