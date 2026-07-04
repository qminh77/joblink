import type { CompanyVerification } from "@/types/database"

export type CompanyAction = "approve" | "reject" | "suspend" | "restore"

export const COMPANY_TAB_STATUS: Record<string, CompanyVerification | "all"> = {
  pending: "pending",
  verified: "verified",
  rejected: "rejected",
  suspended: "suspended",
  all: "all",
}

export function companyVerificationClassName(
  status: CompanyVerification,
): string {
  switch (status) {
    case "verified":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    case "rejected":
      return "bg-red-500/10 text-red-600 border-red-500/20"
    case "suspended":
      return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20"
    default:
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
  }
}
