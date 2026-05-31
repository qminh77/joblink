// CV nằm trong BUCKET PRIVATE riêng `cvs` (KHÔNG dùng chung `uploads` public —
// bucket public override RLS, ai có URL cũng đọc được file). Path layout:
//   cvs/<userId>/<uuid>.pdf      → path_tokens[1] = userId cho RLS check.
// Mọi lượt xem (member preview, company applicant view) đều qua signed URL
// server-sinh ttl ngắn — không có URL công khai trường tồn.
export const CV_BUCKET = "cvs"
export const CV_MAX_BYTES = 5 * 1024 * 1024 // 5MB
export const CV_ALLOWED_MIME = "application/pdf"
export const CV_FILE_NAME_MAX = 160

// Signed URL ttl 5 phút — vừa đủ để load PDF vào iframe; nếu link bị share
// ngoài thì cũng nhanh chóng hết hạn. Re-issue mỗi lần click "Xem".
export const CV_SIGNED_URL_TTL_SECONDS = 5 * 60
