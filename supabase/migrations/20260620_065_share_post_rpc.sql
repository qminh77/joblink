-- =============================================================================
-- #7: Database Transaction — share_post RPC
-- Gộp INSERT posts + INSERT post_shares thành 1 RPC transaction.
-- Thay vì manual compensation (soft-delete khi share fail), toàn bộ chạy
-- trong 1 SECURITY DEFINER function → rollback tự động nếu bất kỳ lệnh nào fail.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.share_post(
  p_content TEXT,
  p_original_post_id BIGINT,
  p_comment_text TEXT DEFAULT NULL,
  p_media JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id BIGINT;
  v_new_post_id BIGINT;
  v_share_id BIGINT;
BEGIN
  -- Xác thực user (SECURITY DEFINER nhưng vẫn cần auth check)
  SELECT id INTO v_author_id FROM public.users
   WHERE auth_id = auth.uid() AND deleted_at IS NULL;

  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Kiểm tra bài gốc tồn tại
  IF NOT EXISTS (
    SELECT 1 FROM public.posts
     WHERE id = p_original_post_id AND deleted_at IS NULL AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalidPost');
  END IF;

  -- Bước 1: Tạo bài post mới (transaction atomic — nếu fail, rollback toàn bộ)
  INSERT INTO public.posts (author_id, content, post_type, media, visibility)
  VALUES (v_author_id, COALESCE(p_content, ''), 'text', p_media, 'public')
  RETURNING id INTO v_new_post_id;

  -- Bước 2: Ghi vào post_shares (nếu fail → rollback cả bước 1)
  INSERT INTO public.post_shares (post_id, user_id, comment_content)
  VALUES (p_original_post_id, v_author_id, p_comment_text)
  RETURNING id INTO v_share_id;

  RETURN jsonb_build_object(
    'ok', true,
    'postId', v_new_post_id,
    'shareId', v_share_id,
    'authorId', v_author_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.share_post(TEXT, BIGINT, TEXT, JSONB) TO authenticated;
