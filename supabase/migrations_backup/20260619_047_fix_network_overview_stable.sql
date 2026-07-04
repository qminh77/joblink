-- =============================================================================
-- FIX: Remove STABLE from get_network_overview
-- 
-- get_network_overview calls generate_quick_suggestions which performs a 
-- DELETE and INSERT on the network_suggestions table. 
-- A function marked as STABLE cannot modify data (causes "cannot execute DELETE in a read-only transaction").
-- Removing STABLE makes it VOLATILE, allowing the DML operations to succeed.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_network_overview(p_suggestion_limit INT DEFAULT 24)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
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
