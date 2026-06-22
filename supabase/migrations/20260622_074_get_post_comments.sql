CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT, p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'postId', c.post_id,
            'userId', c.user_id,
            'parentId', c.parent_id,
            'content', c.content,
            'createdAt', c.created_at,
            'author', jsonb_build_object(
                'userId', c.user_id,
                'role', COALESCE(u.role, 'member'),
                'displayName', COALESCE(mp.full_name, cp.name, 'JobLink'),
                'avatarUrl', COALESCE(mp.avatar_url, cp.logo_url),
                'headline', COALESCE(mp.headline, cp.industry)
            )
        ) ORDER BY c.created_at ASC
    ), '[]'::jsonb) INTO v_result
    FROM (
        SELECT * FROM public.post_comments
        WHERE post_id = p_post_id
          AND deleted_at IS NULL
          AND status = 'active'
        ORDER BY created_at ASC
        LIMIT p_limit
    ) c
    LEFT JOIN public.users u ON u.id = c.user_id
    LEFT JOIN public.member_profiles mp ON mp.user_id = c.user_id AND mp.deleted_at IS NULL
    LEFT JOIN public.company_profiles cp ON cp.user_id = c.user_id AND cp.deleted_at IS NULL;

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_comments(BIGINT, INT) TO authenticated;
