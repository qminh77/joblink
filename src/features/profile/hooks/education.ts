"use client"

import {
  addEducationAction,
  deleteEducationAction,
  updateEducationAction,
} from "../api/education-actions"
import type { MemberEducationInput } from "../schemas"
import { useActionMutation, wrapAction } from "./shared"

export function useAddEducation() {
  return useActionMutation<MemberEducationInput>(
    wrapAction(addEducationAction),
    "Đã thêm học vấn",
  )
}

export function useUpdateEducation() {
  return useActionMutation<MemberEducationInput>(
    wrapAction(updateEducationAction),
    "Đã cập nhật học vấn",
  )
}

export function useDeleteEducation() {
  return useActionMutation<number>(
    wrapAction(deleteEducationAction),
    "Đã xóa học vấn",
  )
}
