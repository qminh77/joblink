-- =============================================================================
-- JOBLINK MIGRATION 20260601_030 — MEMBER CVs ROW LEVEL SECURITY
-- =============================================================================
-- Mục tiêu:
--   • BẬT RLS cho bảng member_cvs (thay cho `DISABLE ROW LEVEL SECURITY` ở
--     migration 20260528_026). Thống nhất với phong cách bảo mật của posts /
--     poll / messaging: RLS bật + policy theo owner, admin bypass.
--   • Vá lỗi 42501 "new row violates row-level security policy for table
--     member_cvs": DB đã bật RLS nhưng KHÔNG có policy nào → mọi insert/select
--     của owner đều bị chặn (upload CV thất bại, đồng thời get_profile_edit_overview
--     đọc rỗng nên UI không hiển thị CV).
--
-- Mô hình quyền:
--   • Owner (member) toàn quyền trên CV của chính mình (user_id = auth_user_id()).
--   • Admin bypass (member_cvs_admin_all) — đồng nhất với các bảng khác.
--   • Company KHÔNG đọc trực tiếp bảng này: xem CV ứng viên qua
--     job_applications.resume_url + signed URL (getApplicantResumeUrlAction),
--     nên không cần policy cho company.
--
-- An toàn với code hiện tại (tất cả ghi/đọc đều chạy bằng quyền owner):
--   • registerCvAction / renameMemberCv / softDeleteMemberCv  → user JWT, owner.
--   • set_default_member_cv()  → SECURITY INVOKER, update theo user_id = me.
--   • get_profile_edit_overview() / loadOwnCvs()  → SECURITY INVOKER, select own.
--   • deleteCvAction xoá binary  → admin client trên storage (không đụng bảng).
-- =============================================================================

ALTER TABLE public.member_cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_cvs_admin_all  ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_select_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_insert_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_update_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_delete_own ON public.member_cvs;

CREATE POLICY member_cvs_admin_all
  ON public.member_cvs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY member_cvs_select_own
  ON public.member_cvs
  FOR SELECT
  USING (user_id = public.auth_user_id());

CREATE POLICY member_cvs_insert_own
  ON public.member_cvs
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY member_cvs_update_own
  ON public.member_cvs
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY member_cvs_delete_own
  ON public.member_cvs
  FOR DELETE
  USING (user_id = public.auth_user_id());
