"use client"

import { updateCompanyProfileAction } from "../api/company-actions"
import type { CompanyProfileInput } from "../schemas"
import { useActionMutation, wrapAction } from "./shared"

export function useUpdateCompanyProfile() {
  return useActionMutation<CompanyProfileInput>(
    wrapAction(updateCompanyProfileAction),
    "Đã lưu thông tin công ty",
  )
}
