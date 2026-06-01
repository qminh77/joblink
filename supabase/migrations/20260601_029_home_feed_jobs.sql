-- =============================================================================
-- JOBLINK MIGRATION 20260601_029 — HOME FEED + JOBS
-- =============================================================================
-- Mục tiêu:
--   • Kích hoạt "VIỆC LÀM GỢI Ý" ở sidebar home bằng dữ liệu thật
--     (suggested_jobs: tin tuyển dụng active mới nhất, kèm viewer state).
--   • Nâng cấp feed: trộn các tin tuyển dụng (job posts) của công ty vào dòng
--     bài viết. Người dùng mới (chưa có kết nối) vẫn thấy nội dung thay vì feed
--     trống.
--
-- Cách phân trang feed (posts + jobs interleave):
--   Cả posts và jobs đều sort theo created_at DESC. Mỗi trang lấy `limit` item
--   mới nhất của MỖI nguồn (cũ hơn cursor), UNION lại, sort chung và cắt
--   `limit` → đúng `limit` item mới nhất toàn cục cũ hơn cursor. next_cursor là
--   created_at nhỏ nhất của lát cắt đó. Trang sau lọc created_at < cursor cho
--   cả hai nguồn → con trỏ thống nhất, không lệch ở ranh giới trang.
--
-- Bảo mật: SECURITY INVOKER — tôn trọng RLS. Job hiển thị = status 'active',
-- chưa xoá mềm, chưa hết hạn (giống get_jobs_list public board).
-- Giữ nguyên signature 3-arg để không phá caller hiện tại.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_home_feed(
    p_posts_cursor TIMESTAMPTZ DEFAULT NULL,
    p_posts_limit  INT         DEFAULT 20,
    p_suggestion_limit INT     DEFAULT 12
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me              BIGINT;
    v_stats           JSONB;
    v_suggestions     JSONB;
    v_suggested_jobs  JSONB;
    v_excluded_ids    BIGINT[];
    v_connection_ids  BIGINT[];
    v_job_suggest_lim CONSTANT INT := 5;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object(
            'stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0),
            'suggestions', '[]'::jsonb,
            'suggested_jobs', '[]'::jsonb,
            'posts', '[]'::jsonb,
            'jobs', '[]'::jsonb,
            'connection_ids', '[]'::jsonb,
            'me', NULL,
            'next_cursor', NULL
        );
    END IF;

    SELECT jsonb_build_object(
        'connection_count', u.connection_count,
        'profile_view_count', u.profile_view_count
    ) INTO v_stats
    FROM public.users u WHERE u.id = v_me;

    SELECT COALESCE(array_agg(DISTINCT other_id), '{}')
      INTO v_excluded_ids
      FROM (
          SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id
                      ELSE c.requester_id END AS other_id
            FROM public.connections c
           WHERE c.requester_id = v_me OR c.receiver_id = v_me
      ) sub;

    SELECT COALESCE(array_agg(DISTINCT other_id), '{}')
      INTO v_connection_ids
      FROM (
          SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id
                      ELSE c.requester_id END AS other_id
            FROM public.connections c
           WHERE c.status = 'accepted'
             AND (c.requester_id = v_me OR c.receiver_id = v_me)
      ) sub;

    -- SUGGESTIONS (people you may know) — giữ nguyên hành vi bản trước.
    WITH candidates AS (
        SELECT u.id, u.role
          FROM public.users u
         WHERE u.deleted_at IS NULL
           AND u.status = 'active'
           AND u.role <> 'admin'
           AND u.id <> v_me
           AND NOT (u.id = ANY(v_excluded_ids))
         ORDER BY RANDOM()
         LIMIT p_suggestion_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s) ORDER BY s.ord), '[]'::jsonb)
      INTO v_suggestions
      FROM (
          SELECT
              row_number() OVER () AS ord,
              c.id   AS "userId",
              c.role,
              COALESCE(mp.full_name, cp.name)   AS "displayName",
              COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
              COALESCE(mp.headline, cp.industry)   AS headline,
              NULLIF(
                  concat_ws(', ',
                      COALESCE(md.name, cd.name),
                      COALESCE(mpr.name, cpr.name)
                  ),
                  ''
              ) AS location
            FROM candidates c
            LEFT JOIN public.member_profiles  mp ON mp.user_id = c.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = c.id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
            LEFT JOIN public.wards md  ON md.id  = mp.ward_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.wards cd  ON cd.id  = cp.ward_id
      ) s;

    -- SUGGESTED JOBS (sidebar "Việc làm gợi ý") — tin active mới nhất + viewer state.
    SELECT COALESCE(jsonb_agg(s.j_obj ORDER BY s.created_at DESC), '[]'::jsonb)
      INTO v_suggested_jobs
      FROM (
          SELECT
              j.created_at,
              jsonb_build_object(
                  'id', j.id,
                  'title', j.title,
                  'companyUserId', j.company_user_id,
                  'companyName', COALESCE(cp.name, u.email),
                  'companyLogoUrl', cp.logo_url,
                  'companyVerified', cp.verification_status = 'verified',
                  'provinceName', pv.name,
                  'wardName', w.name,
                  'jobTypeName', jt.name,
                  'workModeName', wm.name,
                  'salaryMin', j.salary_min,
                  'salaryMax', j.salary_max,
                  'salaryVisible', j.salary_visible,
                  'createdAt', j.created_at,
                  'viewerSaved', EXISTS(
                      SELECT 1 FROM public.saved_jobs sv
                       WHERE sv.user_id = v_me AND sv.job_id = j.id
                  ),
                  'viewerApplied', EXISTS(
                      SELECT 1 FROM public.job_applications a
                       WHERE a.applicant_id = v_me AND a.job_id = j.id
                  )
              ) AS j_obj
            FROM public.jobs j
            JOIN public.users u ON u.id = j.company_user_id
            LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
            LEFT JOIN public.provinces pv ON pv.id = j.province_id
            LEFT JOIN public.wards w ON w.id = j.ward_id
            LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
            LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
           WHERE j.status = 'active'
             AND j.deleted_at IS NULL
             AND (j.expires_at IS NULL OR j.expires_at > NOW())
           ORDER BY j.created_at DESC
           LIMIT v_job_suggest_lim
      ) s;

    -- FEED — posts (me + connections) UNION jobs (active, public board), phân
    -- trang theo unified cursor.
    RETURN (
        WITH visible_authors AS (
            SELECT unnest(array_prepend(v_me, v_connection_ids)) AS author_id
        ),
        post_cand AS (
            SELECT p.id, p.created_at
              FROM public.posts p
              JOIN visible_authors va ON va.author_id = p.author_id
             WHERE p.deleted_at IS NULL
               AND p.status = 'active'
               AND (p.visibility = 'public'
                    OR (p.visibility = 'connections' AND p.author_id = ANY(v_connection_ids))
                    OR p.author_id = v_me)
               AND (p_posts_cursor IS NULL OR p.created_at < p_posts_cursor)
             ORDER BY p.created_at DESC
             LIMIT p_posts_limit
        ),
        job_cand AS (
            SELECT j.id, j.created_at
              FROM public.jobs j
             WHERE j.status = 'active'
               AND j.deleted_at IS NULL
               AND (j.expires_at IS NULL OR j.expires_at > NOW())
               AND (p_posts_cursor IS NULL OR j.created_at < p_posts_cursor)
             ORDER BY j.created_at DESC
             LIMIT p_posts_limit
        ),
        unified AS (
            SELECT kind, id, created_at
              FROM (
                  SELECT 'post'::text AS kind, id, created_at FROM post_cand
                  UNION ALL
                  SELECT 'job'::text  AS kind, id, created_at FROM job_cand
              ) u
             ORDER BY created_at DESC
             LIMIT p_posts_limit
        ),
        posts_json AS (
            SELECT COALESCE(jsonb_agg(x.obj ORDER BY x.created_at DESC), '[]'::jsonb) AS data
              FROM (
                  SELECT
                      p.created_at,
                      jsonb_build_object(
                          'id', p.id,
                          'authorId', p.author_id,
                          'content', p.content,
                          'postType', p.post_type,
                          'media', p.media,
                          'visibility', p.visibility,
                          'createdAt', p.created_at,
                          'author', jsonb_build_object(
                              'userId',      p.author_id,
                              'role',        au.role,
                              'displayName', COALESCE(amp.full_name, acp.name),
                              'avatarUrl',   COALESCE(amp.avatar_url, acp.logo_url),
                              'headline',    COALESCE(amp.headline, acp.industry)
                          ),
                          'reactionCount', (SELECT COUNT(*) FROM public.post_reactions r WHERE r.post_id = p.id),
                          'commentCount', (SELECT COUNT(*) FROM public.post_comments cm
                                            WHERE cm.post_id = p.id AND cm.deleted_at IS NULL AND cm.status = 'active'),
                          'shareCount', (SELECT COUNT(*) FROM public.post_shares sh WHERE sh.post_id = p.id),
                          'viewerReacted', EXISTS (
                              SELECT 1 FROM public.post_reactions r
                               WHERE r.post_id = p.id AND r.user_id = v_me
                          ),
                          'pollOptions', CASE
                            WHEN p.post_type = 'poll' THEN (
                              SELECT COALESCE(jsonb_agg(
                                jsonb_build_object(
                                  'id', po.id,
                                  'optionText', po.option_text,
                                  'voteCount', po.vote_count,
                                  'viewerVoted', EXISTS (
                                    SELECT 1 FROM public.poll_votes pv
                                     WHERE pv.option_id = po.id AND pv.user_id = v_me
                                  )
                                ) ORDER BY po.id
                              ), '[]'::jsonb)
                              FROM public.poll_options po
                              WHERE po.post_id = p.id
                            )
                            ELSE NULL
                          END
                      ) AS obj
                    FROM unified un
                    JOIN public.posts p ON p.id = un.id AND un.kind = 'post'
                    JOIN public.users au ON au.id = p.author_id
                    LEFT JOIN public.member_profiles  amp ON amp.user_id = p.author_id AND amp.deleted_at IS NULL
                    LEFT JOIN public.company_profiles acp ON acp.user_id = p.author_id AND acp.deleted_at IS NULL
              ) x
        ),
        jobs_json AS (
            SELECT COALESCE(jsonb_agg(y.obj ORDER BY y.created_at DESC), '[]'::jsonb) AS data
              FROM (
                  SELECT
                      j.created_at,
                      jsonb_build_object(
                          'id', j.id,
                          'title', j.title,
                          'companyUserId', j.company_user_id,
                          'companyName', COALESCE(cp.name, cu.email),
                          'companyLogoUrl', cp.logo_url,
                          'companyVerified', cp.verification_status = 'verified',
                          'provinceName', pv.name,
                          'wardName', w.name,
                          'jobTypeName', jt.name,
                          'workModeName', wm.name,
                          'salaryMin', j.salary_min,
                          'salaryMax', j.salary_max,
                          'salaryVisible', j.salary_visible,
                          'createdAt', j.created_at,
                          'viewerSaved', EXISTS(
                              SELECT 1 FROM public.saved_jobs sv
                               WHERE sv.user_id = v_me AND sv.job_id = j.id
                          ),
                          'viewerApplied', EXISTS(
                              SELECT 1 FROM public.job_applications a
                               WHERE a.applicant_id = v_me AND a.job_id = j.id
                          )
                      ) AS obj
                    FROM unified un
                    JOIN public.jobs j ON j.id = un.id AND un.kind = 'job'
                    JOIN public.users cu ON cu.id = j.company_user_id
                    LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
                    LEFT JOIN public.provinces pv ON pv.id = j.province_id
                    LEFT JOIN public.wards w ON w.id = j.ward_id
                    LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
                    LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
              ) y
        ),
        cursor_calc AS (
            SELECT CASE WHEN COUNT(*) = p_posts_limit THEN MIN(created_at) ELSE NULL END AS next_cursor
              FROM unified
        )
        SELECT jsonb_build_object(
            'stats',          v_stats,
            'suggestions',    v_suggestions,
            'suggested_jobs', v_suggested_jobs,
            'posts',          (SELECT data FROM posts_json),
            'jobs',           (SELECT data FROM jobs_json),
            'connection_ids', to_jsonb(v_connection_ids),
            'me',             v_me,
            'next_cursor',    (SELECT next_cursor FROM cursor_calc)
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_feed(TIMESTAMPTZ, INT, INT)
    TO authenticated;

-- =============================================================================
-- END MIGRATION 20260601_029
-- =============================================================================
