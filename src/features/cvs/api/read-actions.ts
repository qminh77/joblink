"use server"

import { action, requireRole } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"
import { createClient } from "@/lib/supabase/server"

import {
  getApplicantResumeUrl,
  getOwnCvViewUrl,
  loadCvBuilderProfile,
  loadOwnCvSummaries,
} from "../services/cv.service"
import type {
  ApplicantResumeUrl,
  CvBuilderProfile,
  OwnCvSummary,
} from "../types"
import { requirePositiveId } from "./shared"

export async function getProfileForCvBuilderAction(): Promise<
  ActionResult<CvBuilderProfile>
> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const supabase = await createClient()
    return loadCvBuilderProfile(supabase, current)
  })
}

export async function getCvViewUrlAction(input: {
  cvId?: number
  storagePath?: string
}): Promise<ActionResult<{ url: string }>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const id = requirePositiveId(input.cvId)
    const supabase = await createClient()
    return getOwnCvViewUrl(supabase, current, id)
  })
}

export async function loadOwnCvsAction(): Promise<
  ActionResult<OwnCvSummary[]>
> {
  return action("cvs.errors", async () => {
    const current = await requireRole("member")
    const supabase = await createClient()
    return loadOwnCvSummaries(supabase, current)
  })
}

export async function getApplicantResumeUrlAction(input: {
  applicationId: number
}): Promise<ActionResult<ApplicantResumeUrl>> {
  return action("cvs.errors", async () => {
    const current = await requireRole("company")
    const applicationId = requirePositiveId(input.applicationId)
    const supabase = await createClient()
    return getApplicantResumeUrl(supabase, current, applicationId)
  })
}
