"use client"

import {
  addExperienceAction,
  deleteExperienceAction,
  updateExperienceAction,
} from "../api/actions"
import type { MemberExperienceInput } from "../schemas"
import { useActionMutation, wrapAction } from "./shared"

export function useAddExperience() {
  return useActionMutation<MemberExperienceInput>(
    wrapAction(addExperienceAction),
    "Đã thêm kinh nghiệm",
  )
}

export function useUpdateExperience() {
  return useActionMutation<MemberExperienceInput>(
    wrapAction(updateExperienceAction),
    "Đã cập nhật kinh nghiệm",
  )
}

export function useDeleteExperience() {
  return useActionMutation<number>(
    wrapAction(deleteExperienceAction),
    "Đã xóa kinh nghiệm",
  )
}
