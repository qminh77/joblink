// Cấu hình bucket private `cv` (xem migration 026).
//   Path:  cv/<userId>/<uuid>.pdf  — path_tokens[1] = userId để RLS check owner.
export const CV_BUCKET = "cv"
export const CV_MAX_BYTES = 5 * 1024 * 1024 // 5MB
export const CV_ALLOWED_MIME = "application/pdf"
export const CV_FILE_NAME_MAX = 160

// Signed URL hết hạn sau 1 giờ — đủ để member preview / company tải về sau khi
// click. Mỗi lần xem lại re-issue mới (server side) nên không cần lưu URL.
export const CV_SIGNED_URL_TTL_SECONDS = 60 * 60
