CREATE OR REPLACE FUNCTION public.toggle_post_reaction(p_post_id BIGINT, p_reaction_type VARCHAR(20) DEFAULT 'like')
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT;
    v_existing BIGINT;
    v_reacted BOOLEAN;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;

    SELECT id INTO v_existing FROM public.post_reactions
     WHERE post_id = p_post_id AND user_id = v_me AND reaction_type = p_reaction_type LIMIT 1;

    IF v_existing IS NOT NULL THEN
        DELETE FROM public.post_reactions WHERE id = v_existing;
        v_reacted := FALSE;
    ELSE
        INSERT INTO public.post_reactions(post_id, user_id, reaction_type)
        VALUES (p_post_id, v_me, p_reaction_type)
        ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING;
        v_reacted := TRUE;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'reacted', v_reacted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_post_reaction(BIGINT, VARCHAR) TO authenticated;
