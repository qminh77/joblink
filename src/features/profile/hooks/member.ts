"use client"

import { updateMemberProfileAction } from "../api/actions"
import type { MemberProfileInput } from "../schemas"
import { useActionMutation, wrapAction } from "./shared"

export function useUpdateMemberProfile() {
  return useActionMutation<MemberProfileInput>(
    wrapAction(updateMemberProfileAction),
    "Đã lưu thông tin hồ sơ",
  )
}
