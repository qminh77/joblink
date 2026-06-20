-- =============================================================================
-- #8: Rate Limiting — Bảng rate_limits + RPC check_rate_limit
-- Theo dõi số request mỗi user thực hiện trong 1 khoảng thời gian.
-- Dùng sliding window approach: mỗi request ghi 1 dòng, đếm số dòng trong window.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type  TEXT NOT NULL,           -- 'post', 'comment', 'reaction', 'share', 'vote'
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('second', NOW()),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index để đếm nhanh: mỗi user + action_type trong 1 khoảng thời gian
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action
  ON public.rate_limits(user_id, action_type, created_at);

-- Index để dọn dẹp record cũ
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
  ON public.rate_limits(created_at);

-- RLS: user chỉ thấy rate limits của chính mình (cho audit), admin thấy tất cả
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_select_own"
  ON public.rate_limits FOR SELECT
  USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

CREATE POLICY "rate_limits_insert_own"
  ON public.rate_limits FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

-- Service role có toàn quyền (cho cleanup job)
CREATE POLICY "rate_limits_admin_all"
  ON public.rate_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- RPC: check_rate_limit
-- Kiểm tra user có vượt quá giới hạn không. Trả về true nếu được phép.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id BIGINT,
  p_action_type TEXT,
  p_max_requests INT DEFAULT 10,
  p_window_seconds INT DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Xoá record cũ hơn window
  DELETE FROM public.rate_limits
   WHERE user_id = p_user_id
     AND action_type = p_action_type
     AND created_at < NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Đếm số request trong window hiện tại
  SELECT COUNT(*) INTO v_count
    FROM public.rate_limits
   WHERE user_id = p_user_id
     AND action_type = p_action_type
     AND created_at >= NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Nếu chưa vượt giới hạn → ghi record mới
  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limits (user_id, action_type)
    VALUES (p_user_id, p_action_type);
    RETURN true;
  END IF;

  -- Vượt giới hạn
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(BIGINT, TEXT, INT, INT) TO authenticated;

-- =============================================================================
-- RPC: cleanup_rate_limits — dọn dẹp record cũ (gọi bởi cron hoặc admin)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.rate_limits
   WHERE created_at < NOW() - (p_older_than_hours || ' hours')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits(INT) TO service_role;
