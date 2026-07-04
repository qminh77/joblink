-- =============================================================================
-- JOBLINK MIGRATION 20260601_032 — REPORT TYPES RLS
-- =============================================================================
-- report_types là bảng lookup dùng chung. Nếu Supabase bật RLS mặc định
-- cho toàn bộ project, authenticated user sẽ không SELECT được bảng này,
-- dẫn đến UI báo cáo (ReportDialog) bị trống.
--
-- Giải pháp: thêm policy cho phép mọi authenticated user SELECT report_types.
-- =============================================================================

-- Nếu RLS chưa được bật, việc bật không gây hại — policy sẽ hoạt động khi RLS có hiệu lực.
ALTER TABLE public.report_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_types_select_authenticated ON public.report_types;
CREATE POLICY report_types_select_authenticated
  ON public.report_types
  FOR SELECT
  USING (true);

-- =============================================================================
-- END MIGRATION 20260601_032
-- =============================================================================
