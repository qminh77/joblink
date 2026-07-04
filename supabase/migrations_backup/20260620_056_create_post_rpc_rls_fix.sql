-- 056_create_post_rpc_rls_fix
-- Direct table insert into public.posts is fragile while live RLS drifts.
-- This RPC resolves the author from auth.uid(), checks account status, and
-- inserts through an explicit DB boundary while table RLS remains enabled.

BEGIN;

CREATE OR REPLACE FUNCTION public.create_post(
    p_content TEXT,
    p_post_type TEXT DEFAULT 'text',
    p_media JSONB DEFAULT NULL,
    p_visibility TEXT DEFAULT 'public'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_content TEXT := btrim(COALESCE(p_content, ''));
    v_row public.posts%ROWTYPE;
BEGIN
    v_me := public.auth_user_id();
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF NOT public.is_active_user() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'accountInactive');
    END IF;

    IF p_post_type NOT IN ('text','image','video','article','poll') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidPostType');
    END IF;

    IF p_visibility NOT IN ('public','connections','private') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidVisibility');
    END IF;

    IF v_content = '' AND p_media IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent');
    END IF;

    INSERT INTO public.posts(author_id, content, post_type, media, visibility)
    VALUES (v_me, v_content, p_post_type, p_media, p_visibility)
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'post', jsonb_build_object(
            'id', v_row.id,
            'author_id', v_row.author_id,
            'content', v_row.content,
            'post_type', v_row.post_type,
            'media', v_row.media,
            'visibility', v_row.visibility,
            'created_at', v_row.created_at
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_post(TEXT, TEXT, JSONB, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
