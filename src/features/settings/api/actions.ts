"use server"

// SRS UC Trace - M08 Cai dat ca nhan:
// UC-56 Cap nhat thong tin tai khoan; UC-57 Doi mat khau; UC-58 Cap nhat quyen rieng tu/trang thai.
// UC-59 Tai khoan da chan duoc doc qua network block actions trong settings UI.
// Flow: /settings tabs -> settings action facade -> account/password/privacy actions -> settings repo/Supabase Auth.

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
