"use client"

import { addSkillAction, removeSkillAction } from "../api/skill-actions"
import { useActionMutation, wrapAction } from "./shared"

export function useAddSkill() {
  return useActionMutation<string>(wrapAction(addSkillAction), "Đã thêm kỹ năng")
}

export function useRemoveSkill() {
  return useActionMutation<number>(
    wrapAction(removeSkillAction),
    "Đã xóa kỹ năng",
  )
}
