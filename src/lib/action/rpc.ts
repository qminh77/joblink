import "server-only"

// Cho các action gọi RPC trả về payload dạng `{ ok, ... }` (vd jobs, messaging).
// Khác `action()` ở chỗ payload mang field nghiệp vụ ở cấp cao nhất và mã lỗi
// (`error`) là CODE để client whitelist-translate — không dịch sẵn ở server.

export type RpcResult<T> = (T & { ok: true }) | { ok: false; error: string }

/**
 * Chuẩn hoá kết quả 1 lời gọi RPC:
 *  • Lỗi Postgres → `{ ok:false, error:"unknown" }` (KHÔNG rò `error.message`).
 *  • payload null → `{ ok:false, error:"unknown" }`.
 *  • payload `{ ok:false, error:<code> }` → trả nguyên cho client translate.
 *  • payload `{ ok:true, ... }` → trả nguyên.
 */
export async function rpcResult<T>(
  call: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<RpcResult<T>> {
  const { data, error } = await call
  if (error) {
    console.error("[rpc]", error)
    return { ok: false, error: "unknown" }
  }
  const payload = data as RpcResult<T> | null
  return payload ?? { ok: false, error: "unknown" }
}
