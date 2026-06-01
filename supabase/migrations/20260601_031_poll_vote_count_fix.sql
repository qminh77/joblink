-- =============================================================================
-- JOBLINK MIGRATION 20260601_031 — POLL VOTE COUNT FIX
-- =============================================================================
-- Bug: bỏ phiếu của người KHÔNG phải tác giả không làm tăng vote_count.
--
-- Nguyên nhân: increment_poll_vote_count() chạy ở chế độ SECURITY INVOKER nên
-- lệnh UPDATE poll_options bị RLS policy poll_options_update_own lọc — policy
-- này chỉ cho phép TÁC GIẢ bài viết update. Người vote bình thường không phải
-- tác giả → UPDATE khớp 0 dòng (không báo lỗi) → vote_count đứng yên, % hiển
-- thị sai dù phiếu đã được ghi vào poll_votes.
--
-- Cách sửa:
--   1. Đổi increment_poll_vote_count() sang SECURITY DEFINER (bỏ qua RLS). Việc
--      uỷ quyền vote đã được poll_votes_insert_own kiểm soát trước đó, nên tăng
--      đếm sau khi insert phiếu thành công là an toàn.
--   2. Backfill lại vote_count = số phiếu thực tế trong poll_votes để chữa dữ
--      liệu đã bị lệch từ trước.
-- Idempotent: OR REPLACE + UPDATE backfill có thể chạy lại nhiều lần.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. increment_poll_vote_count → SECURITY DEFINER
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_poll_vote_count(
    p_option_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.poll_options
       SET vote_count = vote_count + 1
     WHERE id = p_option_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_poll_vote_count(BIGINT)
    TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. Backfill vote_count từ số phiếu thực tế (chữa dữ liệu lệch sẵn có)
-- -----------------------------------------------------------------------------
UPDATE public.poll_options po
   SET vote_count = COALESCE(v.cnt, 0)
  FROM (
        SELECT option_id, COUNT(*) AS cnt
          FROM public.poll_votes
         GROUP BY option_id
       ) v
 WHERE v.option_id = po.id
   AND po.vote_count <> COALESCE(v.cnt, 0);

-- Đưa về 0 các option không còn phiếu nào nhưng vote_count vẫn > 0.
UPDATE public.poll_options po
   SET vote_count = 0
 WHERE po.vote_count <> 0
   AND NOT EXISTS (
        SELECT 1 FROM public.poll_votes pv WHERE pv.option_id = po.id
   );

-- =============================================================================
-- END MIGRATION 20260601_031
-- =============================================================================
