import { AuthError } from "@supabase/supabase-js"

const SUPABASE_MESSAGES: Record<string, string> = {
  invalid_credentials: "Email hoặc mật khẩu không chính xác",
  email_not_confirmed: "Email chưa được xác minh. Vui lòng kiểm tra hộp thư.",
  user_already_exists: "Email này đã được đăng ký",
  user_not_found: "Không tìm thấy tài khoản với email này",
  weak_password: "Mật khẩu quá yếu, vui lòng dùng mật khẩu mạnh hơn",
  over_email_send_rate_limit:
    "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút",
  same_password: "Mật khẩu mới phải khác mật khẩu hiện tại",
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    const code = error.code ?? ""
    if (code && SUPABASE_MESSAGES[code]) return SUPABASE_MESSAGES[code]

    const message = error.message.toLowerCase()
    if (message.includes("invalid login")) return SUPABASE_MESSAGES.invalid_credentials
    if (message.includes("already registered"))
      return SUPABASE_MESSAGES.user_already_exists
    if (message.includes("email rate limit"))
      return SUPABASE_MESSAGES.over_email_send_rate_limit
    return error.message
  }

  if (error instanceof Error) return error.message
  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại."
}
