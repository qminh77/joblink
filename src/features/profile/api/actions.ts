"use server"

// SRS UC Trace - M02 Ho so ca nhan:
// UC-09 Cap nhat ho so ca nhan; UC-10 Cap nhat anh ca nhan.
// UC-11 Kinh nghiem; UC-12 Hoc van; UC-13 Ky nang; UC-15 Thong ke ho so.
// Flow: /profile/edit -> edit components/hooks -> profile actions -> profile service/repo -> Supabase.

import {
  updateCompanyMediaAction as updateCompanyMedia,
  updateCompanyProfileAction as updateCompanyProfile,
} from "./company-actions"
import {
  addEducationAction as addEducation,
  deleteEducationAction as deleteEducation,
  updateEducationAction as updateEducation,
} from "./education-actions"
import {
  addExperienceAction as addExperience,
  deleteExperienceAction as deleteExperience,
  updateExperienceAction as updateExperience,
} from "./experience-actions"
import {
  updateMemberMediaAction as updateMemberMedia,
  updateMemberProfileAction as updateMemberProfile,
} from "./member-actions"
import {
  addSkillAction as addSkill,
  removeSkillAction as removeSkill,
} from "./skill-actions"
import {
  getProfileStatsAction as getProfileStats,
  logProfileViewAction as logProfileView,
} from "./view-actions"

export async function updateCompanyMediaAction(
  input: Parameters<typeof updateCompanyMedia>[0],
) {
  return updateCompanyMedia(input)
}

export async function updateCompanyProfileAction(
  input: Parameters<typeof updateCompanyProfile>[0],
) {
  return updateCompanyProfile(input)
}

export async function addEducationAction(
  input: Parameters<typeof addEducation>[0],
) {
  return addEducation(input)
}

export async function deleteEducationAction(
  educationId: Parameters<typeof deleteEducation>[0],
) {
  return deleteEducation(educationId)
}

export async function updateEducationAction(
  input: Parameters<typeof updateEducation>[0],
) {
  return updateEducation(input)
}

export async function addExperienceAction(
  input: Parameters<typeof addExperience>[0],
) {
  return addExperience(input)
}

export async function deleteExperienceAction(
  experienceId: Parameters<typeof deleteExperience>[0],
) {
  return deleteExperience(experienceId)
}

export async function updateExperienceAction(
  input: Parameters<typeof updateExperience>[0],
) {
  return updateExperience(input)
}

export async function updateMemberMediaAction(
  input: Parameters<typeof updateMemberMedia>[0],
) {
  return updateMemberMedia(input)
}

export async function updateMemberProfileAction(
  input: Parameters<typeof updateMemberProfile>[0],
) {
  return updateMemberProfile(input)
}

export async function addSkillAction(skillName: Parameters<typeof addSkill>[0]) {
  return addSkill(skillName)
}

export async function removeSkillAction(
  skillId: Parameters<typeof removeSkill>[0],
) {
  return removeSkill(skillId)
}

export async function getProfileStatsAction() {
  return getProfileStats()
}

export async function logProfileViewAction(
  targetUserId: Parameters<typeof logProfileView>[0],
) {
  return logProfileView(targetUserId)
}
