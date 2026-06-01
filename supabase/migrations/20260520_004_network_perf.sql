-- =============================================================================
-- JOBLINK MIGRATION 20260520_004 — NETWORK PERFORMANCE LAYER 1
-- =============================================================================
-- Mục tiêu:
--   • Cải thiện hiệu năng network page bằng RPC duy nhất trả về suggestions,
--     connections và invitations.
--   • Thêm composite index phục vụ lookup theo status/role/created_at.
--   • Thêm ngữ cảnh tìm kiếm văn bản với GIN trgm cho profile search.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Extension hỗ trợ tìm kiếm %ilike% nhanh hơn
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- 2. Index hot path cho người dùng
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_active_recent
    ON public.users(status, role, deleted_at, created_at DESC)
    WHERE deleted_at IS NULL
      AND status = 'active'
      AND role <> 'admin';

-- -----------------------------------------------------------------------------
-- 3. Index cho connections network queries
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_connections_req_status_requested_at
    ON public.connections(requester_id, status, receiver_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_recv_status_requested_at
    ON public.connections(receiver_id, status, requester_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_req_status_responded_at
    ON public.connections(requester_id, status, receiver_id, responded_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_recv_status_responded_at
    ON public.connections(receiver_id, status, requester_id, responded_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Index cho profile search (search query và suggestion lookup)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_member_profiles_full_name_trgm
    ON public.member_profiles USING gin (full_name gin_trgm_ops)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_headline_trgm
    ON public.member_profiles USING gin (headline gin_trgm_ops)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_name_trgm
    ON public.company_profiles USING gin (name gin_trgm_ops)
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry_trgm
    ON public.company_profiles USING gin (industry gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 5. Single RPC cho network overview
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_network_overview(
    p_suggestion_limit INT DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_excluded_ids BIGINT[];
    v_suggestions JSONB;
    v_connections JSONB;
    v_incoming JSONB;
    v_outgoing JSONB;
BEGIN
    SELECT u.id
      INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object(
            'suggestions', '[]'::jsonb,
            'connections', '[]'::jsonb,
            'incoming', '[]'::jsonb,
            'outgoing', '[]'::jsonb
        );
    END IF;

    SELECT COALESCE(array_agg(DISTINCT other_id), '{}')
      INTO v_excluded_ids
      FROM (
          SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id
                      ELSE c.requester_id END AS other_id
            FROM public.connections c
           WHERE c.requester_id = v_me OR c.receiver_id = v_me
      ) sub;

    WITH suggestion_candidates AS (
        SELECT u.id, u.role
          FROM public.users u
         WHERE u.deleted_at IS NULL
           AND u.status = 'active'
           AND u.role <> 'admin'
           AND u.id <> v_me
           AND NOT (u.id = ANY(v_excluded_ids))
         ORDER BY u.created_at DESC
         LIMIT p_suggestion_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s) ORDER BY s.ord), '[]'::jsonb)
      INTO v_suggestions
      FROM (
          SELECT
              row_number() OVER () AS ord,
              c.id AS "userId",
              c.role,
              COALESCE(mp.full_name, cp.name) AS "displayName",
              COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
              COALESCE(mp.headline, cp.industry) AS "headline",
              NULLIF(
                  concat_ws(', ',
                      COALESCE(md.name, cd.name),
                      COALESCE(mpr.name, cpr.name)
                  ),
                  ''
              ) AS "location"
            FROM suggestion_candidates c
            LEFT JOIN public.member_profiles mp
              ON mp.user_id = c.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp
              ON cp.user_id = c.id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md  ON md.id  = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd  ON cd.id = cp.ward_id
      ) s;

    WITH accepted_connections AS (
        SELECT c.id,
               c.requester_id,
               c.receiver_id,
               COALESCE(c.responded_at, c.requested_at) AS connected_at,
               CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END AS other_id
          FROM public.connections c
         WHERE c.status = 'accepted'
           AND (c.requester_id = v_me OR c.receiver_id = v_me)
         ORDER BY c.responded_at DESC NULLS LAST, c.requested_at DESC
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s) ORDER BY s.ord), '[]'::jsonb)
      INTO v_connections
      FROM (
          SELECT
              row_number() OVER () AS ord,
              ac.id AS "connectionId",
              ac.connected_at AS "connectedAt",
              COALESCE(mp.full_name, cp.name) AS "displayName",
              COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
              COALESCE(mp.headline, cp.industry) AS "headline",
              NULLIF(
                  concat_ws(', ',
                      COALESCE(md.name, cd.name),
                      COALESCE(mpr.name, cpr.name)
                  ),
                  ''
              ) AS "location",
              u.role,
              ac.other_id AS "userId"
            FROM accepted_connections ac
            JOIN public.users u ON u.id = ac.other_id
            LEFT JOIN public.member_profiles mp
              ON mp.user_id = ac.other_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp
              ON cp.user_id = ac.other_id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md  ON md.id  = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd  ON cd.id = cp.ward_id
      ) s;

    WITH incoming_requests AS (
        SELECT c.id,
               c.requester_id AS other_id,
               c.requested_at,
               c.requester_id AS requester_id,
               c.receiver_id AS receiver_id
          FROM public.connections c
         WHERE c.status = 'pending'
           AND c.receiver_id = v_me
         ORDER BY c.requested_at DESC
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s) ORDER BY s.ord), '[]'::jsonb)
      INTO v_incoming
      FROM (
          SELECT
              row_number() OVER () AS ord,
              ir.id AS "connectionId",
              ir.requested_at AS "requestedAt",
              COALESCE(mp.full_name, cp.name) AS "displayName",
              COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
              COALESCE(mp.headline, cp.industry) AS "headline",
              NULLIF(
                  concat_ws(', ',
                      COALESCE(md.name, cd.name),
                      COALESCE(mpr.name, cpr.name)
                  ),
                  ''
              ) AS "location",
              u.role,
              ir.other_id AS "userId",
              'incoming' AS direction
            FROM incoming_requests ir
            JOIN public.users u ON u.id = ir.other_id
            LEFT JOIN public.member_profiles mp
              ON mp.user_id = ir.other_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp
              ON cp.user_id = ir.other_id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md  ON md.id = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd  ON cd.id = cp.ward_id
      ) s;

    WITH outgoing_requests AS (
        SELECT c.id,
               c.receiver_id AS other_id,
               c.requested_at,
               c.requester_id AS requester_id,
               c.receiver_id AS receiver_id
          FROM public.connections c
         WHERE c.status = 'pending'
           AND c.requester_id = v_me
         ORDER BY c.requested_at DESC
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s) ORDER BY s.ord), '[]'::jsonb)
      INTO v_outgoing
      FROM (
          SELECT
              row_number() OVER () AS ord,
              orq.id AS "connectionId",
              orq.requested_at AS "requestedAt",
              COALESCE(mp.full_name, cp.name) AS "displayName",
              COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
              COALESCE(mp.headline, cp.industry) AS "headline",
              NULLIF(
                  concat_ws(', ',
                      COALESCE(md.name, cd.name),
                      COALESCE(mpr.name, cpr.name)
                  ),
                  ''
              ) AS "location",
              u.role,
              orq.other_id AS "userId",
              'outgoing' AS direction
            FROM outgoing_requests orq
            JOIN public.users u ON u.id = orq.other_id
            LEFT JOIN public.member_profiles mp
              ON mp.user_id = orq.other_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp
              ON cp.user_id = orq.other_id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md  ON md.id = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd  ON cd.id = cp.ward_id
      ) s;

    RETURN jsonb_build_object(
        'suggestions', v_suggestions,
        'connections', v_connections,
        'incoming', v_incoming,
        'outgoing', v_outgoing
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_overview(INT)
    TO authenticated;

-- =============================================================================
-- END MIGRATION 20260520_004
-- =============================================================================
