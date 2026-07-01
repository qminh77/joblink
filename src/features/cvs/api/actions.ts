"use server"

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
  return getProfileForCvBuilder()
}

export async function registerCvAction(input: Parameters<typeof registerCv>[0]) {
  return registerCv(input)
}

export async function renameCvAction(input: Parameters<typeof renameCv>[0]) {
  return renameCv(input)
}

export async function deleteCvAction(cvId: Parameters<typeof deleteCv>[0]) {
  return deleteCv(cvId)
}

export async function setDefaultCvAction(
  cvId: Parameters<typeof setDefaultCv>[0],
) {
  return setDefaultCv(cvId)
}

export async function getCvViewUrlAction(
  input: Parameters<typeof getCvViewUrl>[0],
) {
  return getCvViewUrl(input)
}

export async function loadOwnCvsAction() {
  return loadOwnCvs()
}

export async function getApplicantResumeUrlAction(
  input: Parameters<typeof getApplicantResumeUrl>[0],
) {
  return getApplicantResumeUrl(input)
}
