import type { ReportReasonOption } from "../types"

export const REPORT_REASON_OPTIONS = [
  {
    id: 1,
    code: "spam",
    name: "Spam hoặc quảng cáo",
    nameEn: "Spam or advertising",
  },
  {
    id: 2,
    code: "harassment",
    name: "Quấy rối hoặc thù ghét",
    nameEn: "Harassment or hate",
  },
  {
    id: 3,
    code: "scam",
    name: "Lừa đảo",
    nameEn: "Scam or fraud",
  },
  {
    id: 4,
    code: "inappropriate",
    name: "Nội dung không phù hợp",
    nameEn: "Inappropriate content",
  },
  {
    id: 5,
    code: "fake_job",
    name: "Tin tuyển dụng giả",
    nameEn: "Fake job posting",
  },
  {
    id: 6,
    code: "other",
    name: "Khác",
    nameEn: "Other",
  },
] as const satisfies ReportReasonOption[]

export async function loadReportReasons(): Promise<ReportReasonOption[]> {
  return [...REPORT_REASON_OPTIONS]
}

export function getReportReasonLabel(code: string, locale = "vi") {
  const option = REPORT_REASON_OPTIONS.find((item) => item.code === code)
  if (!option) return code
  return locale === "en" && option.nameEn ? option.nameEn : option.name
}
