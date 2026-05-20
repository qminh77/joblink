"use client"

import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  addEducationAction,
  addExperienceAction,
  addSkillAction,
  deleteEducationAction,
  deleteExperienceAction,
  removeSkillAction,
  updateCompanyProfileAction,
  updateEducationAction,
  updateExperienceAction,
  updateMemberProfileAction,
} from "../api/actions"
import type {
  CompanyProfileInput,
  MemberEducationInput,
  MemberExperienceInput,
  MemberProfileInput,
} from "../schemas"

function wrapAction<TArgs, TReturn extends { ok: boolean; error?: string }>(
  fn: (args: TArgs) => Promise<TReturn>,
) {
  return async (args: TArgs) => {
    const result = await fn(args)
    if (!result.ok) {
      throw new Error(result.error ?? "Đã xảy ra lỗi")
    }
    return result
  }
}

function useActionMutation<TArgs>(
  mutationFn: (args: TArgs) => Promise<unknown>,
  successMessage: string,
) {
  const router = useRouter()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateMemberProfile() {
  return useActionMutation<MemberProfileInput>(
    wrapAction(updateMemberProfileAction),
    "Đã lưu thông tin hồ sơ",
  )
}

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

export function useAddSkill() {
  return useActionMutation<string>(wrapAction(addSkillAction), "Đã thêm kỹ năng")
}

export function useRemoveSkill() {
  return useActionMutation<number>(
    wrapAction(removeSkillAction),
    "Đã xóa kỹ năng",
  )
}

export function useUpdateCompanyProfile() {
  return useActionMutation<CompanyProfileInput>(
    wrapAction(updateCompanyProfileAction),
    "Đã lưu thông tin công ty",
  )
}
