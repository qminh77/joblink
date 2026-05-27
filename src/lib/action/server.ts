import "server-only"

import { getTranslations } from "next-intl/server"
import type { ZodType } from "zod"

import { requireCurrentUser } from "@/features/auth/api/auth-server"
import type { CurrentUser } from "@/features/auth/types"
import type { UserRole } from "@/lib/constants"

import { ok, fail, type ActionResult } from "./result"

type Translator = (key: string) => string

/**
 * Lỗi "đã biết" của một action — mang theo thông điệp an toàn để hiển thị.
 *  • `ActionError.key("memberOnly")`  → dịch qua namespace của action.
 *  • `ActionError.text("…")`          → đã là chuỗi hiển thị (vd message zod).
 *
 * Mọi lỗi KHÔNG phải ActionError (lỗi DB thô, exception runtime…) được `action()`
 * nuốt lại và trả về `errors.unexpected` — KHÔNG bao giờ rò `error.message` của
 * Postgres/Supabase ra client.
 */
export class ActionError extends Error {
  readonly resolved: boolean
  private constructor(message: string, resolved: boolean) {
    super(message)
    this.name = "ActionError"
    this.resolved = resolved
  }
  static key(key: string): ActionError {
    return new ActionError(key, false)
  }
  static text(message: string): ActionError {
    return new ActionError(message, true)
  }
  display(t: Translator): string {
    if (this.resolved) return this.message
    try {
      return t(this.message)
    } catch {
      return this.message
    }
  }
}

/**
 * Bọc thân một server action: cấp translator cho `errorNamespace`, gói kết quả
 * thành `ActionResult` và chuẩn hoá lỗi. Thân hàm chỉ cần `throw ActionError`
 * (hoặc để repo throw) thay vì rải `return fail(...)` khắp nơi.
 */
export async function action<T>(
  errorNamespace: string,
  body: (t: Translator) => Promise<T>,
): Promise<ActionResult<T>> {
  const t = await getTranslations(errorNamespace)
  try {
    return ok(await body(t))
  } catch (err) {
    if (err instanceof ActionError) return fail(err.display(t))
    console.error(`[action:${errorNamespace}]`, err)
    return fail(t("unexpected"))
  }
}

/** Validate bằng zod; ném `ActionError` (message đã dịch sẵn) nếu fail. */
export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input)
  if (result.success) return result.data
  const issue = result.error.issues[0]
  throw issue?.message
    ? ActionError.text(issue.message)
    : ActionError.key("invalidData")
}

/** Yêu cầu đăng nhập + đúng role; ném `<role>Only` (vd "memberOnly") nếu sai. */
export async function requireRole(role: UserRole): Promise<CurrentUser> {
  const user = await requireCurrentUser()
  if (user.appUser.role !== role) throw ActionError.key(`${role}Only`)
  return user
}

/**
 * Mở kết quả `{ data, error }` của Supabase: nếu lỗi/null thì log lỗi thô ở
 * server và ném `ActionError.key(failKey)` — client chỉ thấy thông điệp an toàn.
 */
export function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  failKey: string,
): T {
  if (result.error || result.data == null) {
    if (result.error) console.error(`[db:${failKey}]`, result.error)
    throw ActionError.key(failKey)
  }
  return result.data
}

/** Như `unwrap` nhưng cho lệnh ghi không trả data (delete/insert no-select). */
export function assertOk(
  result: { error: { message: string } | null },
  failKey: string,
): void {
  if (result.error) {
    console.error(`[db:${failKey}]`, result.error)
    throw ActionError.key(failKey)
  }
}
