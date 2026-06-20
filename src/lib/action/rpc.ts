import "server-only"

/**
 * Chuẩn hoá kết quả 1 lời gọi Supabase RPC.
 *
 * Hai kiểu lỗi cần phân biệt:
 *  1. Lỗi Supabase/Postgres (error != null)  → map về "unknown", KHÔNG rò message.
 *  2. Lỗi nghiệp vụ (RPC return { ok:false, error:"code" }) → giữ nguyên code gốc
 *     để client translate qua whitelist (vd: "alreadyApplied", "jobExpired").
 */
export type RpcResult<T> = (T & { ok: true }) | { ok: false; error: string }

/**
 * Gọi RPC và chuẩn hoá kết quả:
 *  • Supabase error (error != null) → `{ ok:false, error:"unknown" }` (bảo mật).
 *  • Payload null → `{ ok:false, error:"unknown" }`.
 *  • Payload `{ ok:false, error:<code> }` → giữ nguyên code (client translate).
 *  • Payload `{ ok:true, ... }` → giữ nguyên.
 */
export async function rpcResult<T>(
  call: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<RpcResult<T>> {
  const { data, error } = await call

  // Lỗi Supabase/Postgres — KHÔNG bao giờ expose error.message
  if (error) {
    console.error("[rpc]", error)
    return { ok: false, error: "unknown" }
  }

  // Payload null — RPC không trả gì
  const payload = data as RpcResult<T> | null
  if (!payload) return { ok: false, error: "unknown" }

  // Payload có error code nghiệp vụ — giữ nguyên để client translate
  if (!payload.ok) {
    return { ok: false, error: payload.error || "unknown" }
  }

  // Payload thành công — giữ nguyên
  return payload
}
