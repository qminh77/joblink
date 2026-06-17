"use client"

import { createClient } from "@/lib/supabase/client"

// Passkey (WebAuthn) qua Supabase Auth. Mọi nghi thức WebAuthn chạy ở TRÌNH
// DUYỆT (navigator.credentials) nên các hàm này chỉ dùng client-side. Yêu cầu
// cờ experimental.passkey đã bật ở browser client + Supabase project hỗ trợ.

export type PasskeyItem = {
  id: string
  friendlyName: string | null
  createdAt: string
  lastUsedAt: string | null
}

// Trình duyệt có hỗ trợ WebAuthn không (để ẩn/hiện UI).
export function isPasskeySupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  )
}

// Đăng ký passkey cho người dùng đang đăng nhập (cần session). Tên hiển thị do
// Supabase/thiết bị đặt mặc định (API cấp cao không nhận friendlyName).
export async function registerPasskey(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.registerPasskey()
  if (error) throw error
}

// Đăng nhập passwordless bằng passkey — tạo session khi thành công.
export async function signInWithPasskeyClient(): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPasskey()
  if (error) throw error
}

export async function listPasskeys(): Promise<PasskeyItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.passkey.list()
  if (error) throw error
  return (data ?? []).map((p) => ({
    id: p.id,
    friendlyName: p.friendly_name ?? null,
    createdAt: p.created_at,
    lastUsedAt: p.last_used_at ?? null,
  }))
}

export async function deletePasskey(passkeyId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.auth.passkey.delete({ passkeyId })
  if (error) throw error
}
