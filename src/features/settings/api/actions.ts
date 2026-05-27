"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { createClient } from "@/lib/supabase/server"
import { ActionError, action, assertOk, parse } from "@/lib/action/server"
import { ok, fail, type ActionResult } from "@/lib/action/result"

import {
  createChangePasswordSchema,
  createLocaleSchema,
  createPrivacySchema,
  type ChangePasswordInput,
  type LocaleInput,
  type PrivacyInput,
} from "../schemas"
import {
  updateCompanyOpenToHire,
  updateMemberPrivacy,
  updateUserLocale,
} from "../data/settings.repo"

function revalidateAll() {
  revalidatePath("/settings")
  revalidatePath("/profile/edit")
  revalidatePath("/home")
}

/**
 * Đổi mật khẩu — thao tác AUTH thuần (supabase.auth.*), giữ nguyên luồng:
 * xác minh mật khẩu hiện tại bằng signInWithPassword rồi updateUser. Chỉ chuẩn
 * hoá thông điệp lỗi để không rò chi tiết auth ra client.
 */
export async function changePasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult> {
  const tv = await getTranslations("settings.validation")
  const tp = await getTranslations("settings.password")

  const parsed = createChangePasswordSchema(tv).safeParse(input)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? tv("currentPasswordRequired"))
  }

  const current = await requireCurrentUser()
  const supabase = await createClient()

  const verify = await supabase.auth.signInWithPassword({
    email: current.appUser.email,
    password: parsed.data.currentPassword,
  })
  if (verify.error) return fail(tp("wrongCurrent"))

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })
  if (error) {
    console.error("[changePasswordAction]", error)
    return fail(tp("updateFailed"))
  }

  return ok(undefined)
}

export async function updatePrivacyAction(
  input: PrivacyInput,
): Promise<ActionResult> {
  return action("settings.errors", async () => {
    const data = parse(createPrivacySchema(), input)
    const current = await requireCurrentUser()
    if (current.appUser.role !== "member") {
      throw ActionError.key("privacyMemberOnly")
    }
    const supabase = await createClient()
    assertOk(
      await updateMemberPrivacy(supabase, current.appUser.id, {
        profileVisibility: data.profileVisibility,
        openToWork: data.openToWork,
      }),
      "unexpected",
    )
    revalidateAll()
  })
}

export async function updateCompanyOpenToHireAction(
  openToHire: boolean,
): Promise<ActionResult> {
  return action("settings.errors", async () => {
    const current = await requireCurrentUser()
    if (current.appUser.role !== "company") {
      throw ActionError.key("openToHireCompanyOnly")
    }
    const supabase = await createClient()
    assertOk(
      await updateCompanyOpenToHire(supabase, current.appUser.id, openToHire),
      "unexpected",
    )
    revalidateAll()
  })
}

export async function updateLocaleAction(
  input: LocaleInput,
): Promise<ActionResult> {
  return action("settings.errors", async () => {
    const tv = await getTranslations("settings.validation")
    const data = parse(createLocaleSchema(tv), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()
    assertOk(
      await updateUserLocale(supabase, current.appUser.id, data.locale),
      "unexpected",
    )

    // Đồng bộ cookie để request kế tiếp dùng locale mới ngay.
    try {
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      cookieStore.set("NEXT_LOCALE", data.locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      })
    } catch {
      // ignore
    }

    revalidateAll()
  })
}
