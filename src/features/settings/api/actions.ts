"use server"

import {
  updateAccountAction as updateAccount,
} from "./account-actions"
import {
  updateLocaleAction as updateLocale,
} from "./locale-actions"
import {
  changePasswordAction as changePassword,
} from "./password-actions"
import {
  updateCompanyOpenToHireAction as updateCompanyOpenToHire,
  updatePrivacyAction as updatePrivacy,
} from "./privacy-actions"

export async function changePasswordAction(
  input: Parameters<typeof changePassword>[0],
) {
  return changePassword(input)
}

export async function updatePrivacyAction(
  input: Parameters<typeof updatePrivacy>[0],
) {
  return updatePrivacy(input)
}

export async function updateCompanyOpenToHireAction(
  openToHire: Parameters<typeof updateCompanyOpenToHire>[0],
) {
  return updateCompanyOpenToHire(openToHire)
}

export async function updateLocaleAction(
  input: Parameters<typeof updateLocale>[0],
) {
  return updateLocale(input)
}

export async function updateAccountAction(
  input: Parameters<typeof updateAccount>[0],
) {
  return updateAccount(input)
}
