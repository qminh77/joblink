-- =============================================================================
-- #9: create_poll_post RPC — Transaction atomic
-- Gộp INSERT posts + INSERT poll_options + UPDATE media trong 1 transaction.
-- Thay vì 3 separate queries (insertPost → insertPollOptions → updatePost),
-- toàn bộ chạy trong 1 SECURITY DEFINER function → atomic rollback.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_poll_post(
  p_content TEXT,
  p_visibility TEXT DEFAULT 'public',
  p_options JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id BIGINT;
  v_post_id BIGINT;
  v_option RECORD;
  v_options JSONB := '[]'::JSONB;
  v_total_votes INT := 0;
BEGIN
  -- Xác thực user
  SELECT id INTO v_author_id FROM public.users
   WHERE auth_id = auth.uid() AND deleted_at IS NULL;

  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  -- Validate: poll phải có ít nhất 2 options
  IF jsonb_array_length(p_options) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalidOptions');
  END IF;

  -- Bước 1: Tạo post với post_type = 'poll'
  INSERT INTO public.posts (author_id, content, post_type, visibility)
  VALUES (v_author_id, COALESCE(p_content, ''), 'poll', p_visibility)
  RETURNING id INTO v_post_id;

  -- Bước 2: Insert poll options
  FOR v_option IN SELECT value->>0 AS option_text FROM jsonb_array_elements(p_options) AS value
  LOOP
    INSERT INTO public.poll_options (post_id, option_text, vote_count)
    VALUES (v_post_id, v_option.option_text, 0)
    RETURNING id, option_text, vote_count INTO STRICT v_option;

    v_options := v_options || jsonb_build_object(
      'id', v_option.id,
      'optionText', v_option.option_text,
      'voteCount', 0
    );
  END LOOP;

  -- Bước 3: Update post.media với poll options
  UPDATE public.posts
  SET media = jsonb_build_object(
    'type', 'poll',
    'options', v_options,
    'totalVotes', v_total_votes
  )
  WHERE id = v_post_id;

  RETURN jsonb_build_object(
    'ok', true,
    'postId', v_post_id,
    'authorId', v_author_id,
    'options', v_options,
    'totalVotes', v_total_votes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_poll_post(TEXT, TEXT, JSONB) TO authenticated;
