"use server"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import { sendEmailChangeVerification } from "@/features/auth/api/auth-mailer"
import { createClient } from "@/lib/supabase/server"
import { ActionError, action, assertOk, parse } from "@/lib/action/server"
import { ok, fail, type ActionResult } from "@/lib/action/result"

import {
  createAccountSchema,
  createChangePasswordSchema,
  createLocaleSchema,
  createPrivacySchema,
  type AccountInput,
  type ChangePasswordInput,
  type LocaleInput,
  type PrivacyInput,
} from "../schemas"
import {
  updateCompanyOpenToHire,
  updateMemberPrivacy,
  updateUserLocale,
  updateUserPhone,
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

// UC-66: cập nhật email đăng nhập (cần xác minh lại qua link Supabase gửi tới
// email mới) và số điện thoại. public.users.email được đồng bộ bởi trigger
// on_auth_user_updated sau khi người dùng xác nhận; vì vậy KHÔNG tự ghi đè ở đây.
export async function updateAccountAction(
  input: AccountInput,
): Promise<ActionResult<{ emailChangeRequested: boolean }>> {
  return action("settings.errors", async () => {
    const tv = await getTranslations("settings.validation")
    const data = parse(createAccountSchema(tv), input)
    const current = await requireCurrentUser()
    const supabase = await createClient()

    let emailChangeRequested = false

    const newEmail = data.email.trim().toLowerCase()
    if (newEmail !== current.appUser.email.toLowerCase()) {
      // Gửi link xác nhận tới email MỚI qua SMTP của Admin (không dùng
      // supabase.auth.updateUser tự gửi). public.users.email đồng bộ qua
      // trigger 037 sau khi người dùng xác nhận.
      const { cookies } = await import("next/headers")
      const cookieStore = await cookies()
      const localeCookie = cookieStore.get("NEXT_LOCALE")?.value
      const sent = await sendEmailChangeVerification(
        current.appUser.email,
        newEmail,
        localeCookie === "en" ? "en" : "vi",
      )
      if (!sent.ok) {
        throw ActionError.key(
          sent.code === "email_exists" ? "emailInUse" : "emailUpdateFailed",
        )
      }
      emailChangeRequested = true
    }

    const newPhone = data.phone?.trim() ? data.phone.trim() : null
    if (newPhone !== (current.appUser.phone ?? null)) {
      assertOk(
        await updateUserPhone(supabase, current.appUser.id, newPhone),
        "unexpected",
      )
    }

    revalidateAll()
    return { emailChangeRequested }
  })
}
