"use server"

// SRS UC Trace - M02 CV:
// UC-16 Tai CV len; UC-17 Tao CV tu ho so; UC-18 Quan ly CV da luu; UC-19 Dat CV mac dinh.
// Flow: /profile/edit CV tab -> CV component/hook -> CV action facade -> cv.service/cvs.repo -> private cvs storage.

import {
  deleteCvAction as deleteCv,
  registerCvAction as registerCv,
  renameCvAction as renameCv,
  setDefaultCvAction as setDefaultCv,
} from "./manage-actions"
import {
  getApplicantResumeUrlAction as getApplicantResumeUrl,
  getCvViewUrlAction as getCvViewUrl,
  getProfileForCvBuilderAction as getProfileForCvBuilder,
  loadOwnCvsAction as loadOwnCvs,
} from "./read-actions"

export async function getProfileForCvBuilderAction() {
  // UC-17: lay du lieu ho so lam nguon cho CV builder.
  return getProfileForCvBuilder()
}

export async function registerCvAction(input: Parameters<typeof registerCv>[0]) {
  // UC-16/UC-17: dang ky metadata CV sau khi upload PDF hoac tao CV tu ho so.
  return registerCv(input)
}

export async function renameCvAction(input: Parameters<typeof renameCv>[0]) {
  // UC-18: doi ten CV da luu.
  return renameCv(input)
}

export async function deleteCvAction(cvId: Parameters<typeof deleteCv>[0]) {
  // UC-18: xoa CV da luu cua chinh thanh vien.
  return deleteCv(cvId)
}

export async function setDefaultCvAction(
  cvId: Parameters<typeof setDefaultCv>[0],
) {
  // UC-19: dat mot CV lam mac dinh, service bao dam moi thanh vien chi co mot default CV.
  return setDefaultCv(cvId)
}

export async function getCvViewUrlAction(
  input: Parameters<typeof getCvViewUrl>[0],
) {
  // UC-18: cap signed URL de xem CV rieng tu theo quyen truy cap.
  return getCvViewUrl(input)
}

export async function loadOwnCvsAction() {
  // UC-18: tai danh sach CV cua thanh vien hien tai.
  return loadOwnCvs()
}

export async function getApplicantResumeUrlAction(
  input: Parameters<typeof getApplicantResumeUrl>[0],
) {
  // UC-47/UC-48: cong ty xem CV duoc nop trong ho so ung tuyen hop le.
  return getApplicantResumeUrl(input)
}
