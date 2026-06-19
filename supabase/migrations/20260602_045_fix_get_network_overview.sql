-- =============================================================================
-- FIX: Bổ sung connectionId, connectedAt, requestedAt, direction, location
-- cho get_network_overview (bị migration 042 bỏ sót).
--
-- Chạy an toàn (idempotent): không xoá/di chuyển gì, chỉ CREATE OR REPLACE
-- function đã tồn tại.
-- =============================================================================

-- 1. Đảm bảo generate_quick_suggestions tồn tại (cần cho get_network_overview)
CREATE OR REPLACE FUNCTION public.generate_quick_suggestions(p_user_id BIGINT, p_limit INT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM public.network_suggestions WHERE user_id = p_user_id;
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT p_user_id, u.id, 1
      FROM public.users u
     WHERE u.deleted_at IS NULL AND u.status = 'active' AND u.role <> 'admin' AND u.id <> p_user_id
       AND u.id NOT IN (SELECT to_user_id FROM public.user_connections_view WHERE from_user_id = p_user_id)
     ORDER BY u.id DESC LIMIT p_limit * 5;
END;
$$;

-- 2. Viết lại get_network_overview với đầy đủ fields
CREATE OR REPLACE FUNCTION public.get_network_overview(p_suggestion_limit INT DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_suggestions JSONB; v_connections JSONB; v_incoming JSONB; v_outgoing JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('suggestions', '[]'::jsonb, 'connections', '[]'::jsonb, 'incoming', '[]'::jsonb, 'outgoing', '[]'::jsonb);
    END IF;

    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);

    -- Suggestions (NetworkUserCard)
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (
          SELECT c.suggested_user_id AS "userId",
                 u.role,
                 COALESCE(mp.full_name, cp.name) AS "displayName",
                 COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                 COALESCE(mp.headline, cp.industry) AS "headline",
                 NULLIF(concat_ws(', ', COALESCE(md.name, cd.name), COALESCE(mpr.name, cpr.name)), '') AS "location"
            FROM public.network_suggestions c
            JOIN public.users u ON u.id = c.suggested_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md ON md.id = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd ON cd.id = cp.ward_id
           WHERE c.user_id = v_me
           ORDER BY RANDOM()
           LIMIT p_suggestion_limit
      ) s;

    -- Connections (ConnectionItem)
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_connections
      FROM (
          SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END AS "userId",
                 u.role,
                 COALESCE(mp.full_name, cp.name) AS "displayName",
                 COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                 COALESCE(mp.headline, cp.industry) AS "headline",
                 NULLIF(concat_ws(', ', COALESCE(md.name, cd.name), COALESCE(mpr.name, cpr.name)), '') AS "location",
                 c.id AS "connectionId",
                 COALESCE(c.responded_at, c.requested_at) AS "connectedAt"
            FROM public.connections c
            JOIN public.users u ON u.id = (CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END)
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md ON md.id = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd ON cd.id = cp.ward_id
           WHERE (c.requester_id = v_me OR c.receiver_id = v_me) AND c.status = 'accepted'
           ORDER BY c.responded_at DESC NULLS LAST, c.requested_at DESC
           LIMIT 50
      ) s;

    -- Incoming (InvitationItem)
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_incoming
      FROM (
          SELECT c.requester_id AS "userId",
                 u.role,
                 COALESCE(mp.full_name, cp.name) AS "displayName",
                 COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                 COALESCE(mp.headline, cp.industry) AS "headline",
                 NULLIF(concat_ws(', ', COALESCE(md.name, cd.name), COALESCE(mpr.name, cpr.name)), '') AS "location",
                 c.id AS "connectionId",
                 c.requested_at AS "requestedAt",
                 'incoming' AS direction
            FROM public.connections c
            JOIN public.users u ON u.id = c.requester_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = c.requester_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = c.requester_id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md ON md.id = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd ON cd.id = cp.ward_id
           WHERE c.receiver_id = v_me AND c.status = 'pending'
           ORDER BY c.requested_at DESC
           LIMIT 50
      ) s;

    -- Outgoing (InvitationItem)
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_outgoing
      FROM (
          SELECT c.receiver_id AS "userId",
                 u.role,
                 COALESCE(mp.full_name, cp.name) AS "displayName",
                 COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                 COALESCE(mp.headline, cp.industry) AS "headline",
                 NULLIF(concat_ws(', ', COALESCE(md.name, cd.name), COALESCE(mpr.name, cpr.name)), '') AS "location",
                 c.id AS "connectionId",
                 c.requested_at AS "requestedAt",
                 'outgoing' AS direction
            FROM public.connections c
            JOIN public.users u ON u.id = c.receiver_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = c.receiver_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = c.receiver_id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md ON md.id = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd ON cd.id = cp.ward_id
           WHERE c.requester_id = v_me AND c.status = 'pending'
           ORDER BY c.requested_at DESC
           LIMIT 50
      ) s;

    RETURN jsonb_build_object('suggestions', v_suggestions, 'connections', v_connections, 'incoming', v_incoming, 'outgoing', v_outgoing);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_overview(INT) TO authenticated;
