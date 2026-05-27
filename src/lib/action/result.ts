// Kết quả chuẩn cho mọi server action. Trước đây mỗi feature tự định nghĩa lại
// `ActionResult`/`ok`/`fail` (posts, profile, network, messaging…) — gom về một
// nguồn duy nhất để hành vi nhất quán và client chỉ cần check `.ok`.
//
// File này KHÔNG `server-only`: type là hợp đồng trả về giữa server action và
// client hook, nên cần import được từ cả hai phía.

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}
