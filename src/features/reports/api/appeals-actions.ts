"use server"

import { revalidatePath } from "next/cache"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { ActionError, action, parse, unwrap } from "@/lib/action/server"
import type { ActionResult } from "@/lib/action/result"

import { createAppealSchema } from "../schemas"
import type { MyAppeal, MyModerationAction } from "../types"
import {
  isModerationActionAgainstUser,
  listAccountModerationActions,
} from "../data/appeals.privileged"
import {
  findMyAppealForAction,
  insertAppeal,
  listMyAppeals,
} from "../data/appeals.repo"

// UC-71: liệt kê hành động kiểm duyệt cấp tài khoản nhắm vào người dùng hiện tại,
// gắn kèm đơn khiếu nại (nếu đã gửi).
export async function getMyAppealsOverviewAction(): Promise<MyModerationAction[]> {
  const current = await requireCurrentUser()
  const me = current.appUser.id
  const supabase = await createClient()

  const [actions, { data: appeals }] = await Promise.all([
    listAccountModerationActions(me),
    listMyAppeals(supabase, me),
  ])

  const appealByAction = new Map<number, MyAppeal>()
  for (const a of appeals ?? []) {
    if (a.moderation_action_id != null && !appealByAction.has(a.moderation_action_id)) {
      appealByAction.set(a.moderation_action_id, {
        id: a.id,
        status: a.status,
        reason: a.reason,
        createdAt: a.created_at,
        reviewedAt: a.reviewed_at,
      })
    }
  }

  return actions.map((act) => ({
    ...act,
    appeal: appealByAction.get(act.id) ?? null,
  }))
}

export async function submitAppealAction(input: {
  moderationActionId: number
  reason: string
}): Promise<ActionResult<{ appealId: number }>> {
  return action("reports.errors", async (t) => {
    const data = parse(createAppealSchema(t), input)
    const current = await requireCurrentUser()
    const me = current.appUser.id

    // Xác minh hành động kiểm duyệt đúng là nhắm vào user này (admin client) —
    // chặn việc khiếu nại một action bất kỳ.
    const valid = await isModerationActionAgainstUser(
      data.moderationActionId,
      me,
    )
    if (!valid) throw ActionError.key("actionNotFound")

    const supabase = await createClient()

    // Không cho gửi trùng đơn cho cùng một hành động.
    const { data: existing } = await findMyAppealForAction(
      supabase,
      me,
      data.moderationActionId,
    )
    if (existing) throw ActionError.key("alreadyAppealed")

    const row = unwrap(
      await insertAppeal(supabase, {
        appellantId: me,
        moderationActionId: data.moderationActionId,
        reason: data.reason,
      }),
      "appealFailed",
    )
    revalidatePath("/settings")
    return { appealId: row.id }
  })
}
