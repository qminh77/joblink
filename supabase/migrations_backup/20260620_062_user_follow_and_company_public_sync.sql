-- JOBLINK MIGRATION 20260620_062 — USER FOLLOW + COMPANY PUBLIC SYNC
-- - Add member follow/unfollow through the shared follows table.
-- - Return member follower metadata from get_profile_detail.
-- - Keep company public RPC aligned with company_profiles.cover_url and approval rules.
-- - Remove the stray text overload introduced by the cover migration.

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

DROP FUNCTION IF EXISTS public.get_company_public_overview(TEXT);

DROP POLICY IF EXISTS follows_insert_own ON public.follows;
CREATE POLICY follows_insert_own ON public.follows
  FOR INSERT WITH CHECK (
    follower_id = public.auth_user_id()
    AND public.is_active_user()
    AND followable_id <> follower_id
    AND (
      (
        followable_type = 'user'
        AND EXISTS (
          SELECT 1
            FROM public.users u
           WHERE u.id = followable_id
             AND u.role = 'member'
             AND u.status = 'active'
             AND u.deleted_at IS NULL
        )
      )
      OR (
        followable_type = 'company'
        AND EXISTS (
          SELECT 1
            FROM public.users u
            JOIN public.company_profiles cp
              ON cp.user_id = u.id
             AND cp.deleted_at IS NULL
             AND cp.verification_status = 'verified'
           WHERE u.id = followable_id
             AND u.role = 'company'
             AND u.status = 'active'
             AND u.deleted_at IS NULL
        )
      )
    )
  );

CREATE OR REPLACE FUNCTION public.get_profile_detail(p_target_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_target public.users%ROWTYPE; v_is_owner BOOLEAN;
    v_relation JSONB; v_conn RECORD; v_profile JSONB;
    v_province JSONB; v_ward JSONB; v_is_visible BOOLEAN;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB;
    v_follower_cnt INT; v_is_following BOOLEAN; v_visibility TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN NULL; END IF;
    SELECT * INTO v_target FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL;
    IF v_target.id IS NULL THEN RETURN NULL; END IF;
    v_is_owner := (v_me = v_target.id);

    IF v_is_owner THEN v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me) LIMIT 1;
        IF v_conn.id IS NULL THEN v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id); END IF;
    END IF;

    IF v_target.role = 'company' THEN
        SELECT to_jsonb(cp) INTO v_profile FROM public.company_profiles cp
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        IF v_profile IS NULL THEN RETURN NULL; END IF;
        IF NOT v_is_owner AND COALESCE(v_profile ->> 'verification_status', '') <> 'verified' THEN
            RETURN NULL;
        END IF;
        SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
          FROM public.company_profiles cp JOIN public.provinces pv ON pv.id = cp.province_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
          FROM public.company_profiles cp JOIN public.wards dt ON dt.id = cp.ward_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;
        SELECT COUNT(*)::INT INTO v_follower_cnt FROM public.follows f
         WHERE f.followable_type = 'company' AND f.followable_id = v_target.id;
        IF v_is_owner THEN v_is_following := FALSE;
        ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
             AND f.followable_type = 'company' AND f.followable_id = v_target.id) INTO v_is_following;
        END IF;
        RETURN jsonb_build_object('kind', 'company', 'isOwner', v_is_owner, 'relation', v_relation,
            'profile', v_profile, 'email', v_target.email, 'province', v_province, 'ward', v_ward,
            'profileViewCount', v_target.profile_view_count, 'connectionCount', v_target.connection_count,
            'followerCount', COALESCE(v_follower_cnt, 0), 'isFollowing', COALESCE(v_is_following, FALSE));
    END IF;

    SELECT to_jsonb(mp) INTO v_profile FROM public.member_profiles mp
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
      FROM public.member_profiles mp JOIN public.provinces pv ON pv.id = mp.province_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
      FROM public.member_profiles mp JOIN public.wards dt ON dt.id = mp.ward_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_follower_cnt FROM public.follows f
     WHERE f.followable_type = 'user' AND f.followable_id = v_target.id;
    IF v_is_owner THEN v_is_following := FALSE;
    ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
         AND f.followable_type = 'user' AND f.followable_id = v_target.id) INTO v_is_following;
    END IF;
    v_visibility := v_profile ->> 'profile_visibility';
    v_is_visible := (v_visibility IS DISTINCT FROM 'private') OR v_is_owner;
    IF v_is_visible THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
          INTO v_experiences FROM public.member_experiences e WHERE e.user_id = v_target.id AND e.deleted_at IS NULL;
        SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC), '[]'::jsonb)
          INTO v_educations FROM public.member_educations ed WHERE ed.user_id = v_target.id AND ed.deleted_at IS NULL;
        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
          INTO v_skills FROM public.member_skills ms
         WHERE ms.user_id = v_target.id;
    ELSE v_experiences := '[]'::jsonb; v_educations := '[]'::jsonb; v_skills := '[]'::jsonb;
         v_profile := jsonb_build_object(
            'id', v_profile -> 'id',
            'user_id', v_target.id,
            'full_name', '',
            'avatar_url', NULL,
            'cover_url', NULL,
            'headline', NULL,
            'about', NULL,
            'province_id', NULL,
            'ward_id', NULL,
            'website', NULL,
            'open_to_work', FALSE,
            'profile_visibility', v_visibility,
            'created_at', v_profile -> 'created_at',
            'updated_at', v_profile -> 'updated_at',
            'deleted_at', NULL
         );
         v_province := NULL;
         v_ward := NULL;
    END IF;
    RETURN jsonb_build_object('kind', 'member', 'isOwner', v_is_owner, 'relation', v_relation,
        'profile', v_profile, 'email', v_target.email, 'province', v_province, 'ward', v_ward,
        'profileViewCount', v_target.profile_view_count, 'connectionCount', v_target.connection_count,
        'followerCount', COALESCE(v_follower_cnt, 0), 'isFollowing', COALESCE(v_is_following, FALSE),
        'isVisible', v_is_visible, 'experiences', COALESCE(v_experiences, '[]'::jsonb),
        'educations', COALESCE(v_educations, '[]'::jsonb), 'skills', COALESCE(v_skills, '[]'::jsonb));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_detail(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_company_public_overview(
    p_company_user_id BIGINT, p_jobs_limit INT DEFAULT 8
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_company JSONB; v_jobs JSONB;
    v_follower_count INT; v_jobs_count INT; v_is_following BOOLEAN; v_jobs_lim INT;
BEGIN
    v_jobs_lim := GREATEST(LEAST(COALESCE(p_jobs_limit, 8), 50), 1);
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT jsonb_build_object('userId', u.id, 'companyId', cp.id, 'name', cp.name,
        'slug', cp.slug, 'logoUrl', cp.logo_url, 'coverUrl', cp.cover_url,
        'about', cp.about, 'website', cp.website,
        'industry', cp.industry, 'size', cp.size, 'openToHire', cp.open_to_hire,
        'verificationStatus', cp.verification_status, 'provinceName', pv.name,
        'wardName', dt.name, 'businessAddress', cp.business_address,
        'businessEmail', cp.business_email, 'representativeName', cp.representative_name,
        'representativeTitle', cp.representative_title, 'createdAt', cp.created_at)
      INTO v_company FROM public.users u JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL
      LEFT JOIN public.provinces pv ON pv.id = cp.province_id LEFT JOIN public.wards dt ON dt.id = cp.ward_id
     WHERE u.id = p_company_user_id
       AND u.deleted_at IS NULL
       AND u.role = 'company'
       AND u.status = 'active'
       AND (u.id = v_me OR cp.verification_status = 'verified');
    IF v_company IS NULL THEN RETURN NULL; END IF;
    SELECT COUNT(*)::INT INTO v_jobs_count FROM public.jobs j
     WHERE j.company_user_id = p_company_user_id AND j.status = 'active'
       AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW());
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'salaryMin', x.salary_min,
        'salaryMax', x.salary_max, 'salaryVisible', x.salary_visible, 'provinceName', x.province_name,
        'wardName', x.ward_name, 'jobTypeName', x.job_type_name, 'workModeName', x.work_mode_name,
        'createdAt', x.created_at) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
                   pv.name AS province_name, dt.name AS ward_name, jt.name AS job_type_name,
                   wm.name AS work_mode_name, j.created_at
              FROM public.jobs j
              LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards dt ON dt.id = j.ward_id
              LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
             WHERE j.company_user_id = p_company_user_id AND j.status = 'active'
               AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW())
             ORDER BY j.created_at DESC LIMIT v_jobs_lim) x;
    SELECT COUNT(*)::INT INTO v_follower_count FROM public.follows f
     WHERE f.followable_type = 'company' AND f.followable_id = p_company_user_id;
    IF v_me IS NULL OR v_me = p_company_user_id THEN v_is_following := FALSE;
    ELSE SELECT EXISTS(SELECT 1 FROM public.follows f WHERE f.follower_id = v_me
         AND f.followable_type = 'company' AND f.followable_id = p_company_user_id) INTO v_is_following;
    END IF;
    RETURN jsonb_build_object('company', v_company, 'jobsCount', v_jobs_count,
        'followerCount', v_follower_count, 'isFollowing', COALESCE(v_is_following, FALSE),
        'isOwner', COALESCE(v_me = p_company_user_id, FALSE), 'jobs', v_jobs);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public_overview(BIGINT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_follow_company(p_company_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_target_role TEXT; v_target_status TEXT; v_verification_status TEXT;
    v_existing BIGINT; v_is_following BOOLEAN; v_count INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_me = p_company_user_id THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'selfFollow'); END IF;
    SELECT u.role, u.status, cp.verification_status
      INTO v_target_role, v_target_status, v_verification_status
      FROM public.users u
      LEFT JOIN public.company_profiles cp
        ON cp.user_id = u.id
       AND cp.deleted_at IS NULL
     WHERE u.id = p_company_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound'); END IF;
    IF v_target_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_target_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    IF COALESCE(v_verification_status, '') <> 'verified' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound'); END IF;
    SELECT id INTO v_existing FROM public.follows
     WHERE follower_id = v_me AND followable_type = 'company' AND followable_id = p_company_user_id LIMIT 1;
    IF v_existing IS NOT NULL THEN DELETE FROM public.follows WHERE id = v_existing; v_is_following := FALSE;
    ELSE INSERT INTO public.follows(follower_id, followable_type, followable_id)
         VALUES (v_me, 'company', p_company_user_id) ON CONFLICT DO NOTHING; v_is_following := TRUE;
    END IF;
    SELECT COUNT(*)::INT INTO v_count FROM public.follows
     WHERE followable_type = 'company' AND followable_id = p_company_user_id;
    RETURN jsonb_build_object('ok', TRUE, 'isFollowing', v_is_following, 'followerCount', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow_company(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.toggle_follow_user(p_target_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_target_role TEXT; v_target_status TEXT;
    v_existing BIGINT; v_is_following BOOLEAN; v_count INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_me = p_target_user_id THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'selfFollow'); END IF;

    SELECT u.role, u.status INTO v_target_role, v_target_status
      FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'userNotFound'); END IF;
    IF v_target_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'userNotFound'); END IF;
    IF v_target_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'targetInactive'); END IF;

    SELECT id INTO v_existing FROM public.follows
     WHERE follower_id = v_me AND followable_type = 'user' AND followable_id = p_target_user_id LIMIT 1;
    IF v_existing IS NOT NULL THEN
        DELETE FROM public.follows WHERE id = v_existing;
        v_is_following := FALSE;
    ELSE
        INSERT INTO public.follows(follower_id, followable_type, followable_id)
        VALUES (v_me, 'user', p_target_user_id)
        ON CONFLICT DO NOTHING;
        v_is_following := TRUE;
    END IF;

    SELECT COUNT(*)::INT INTO v_count FROM public.follows
     WHERE followable_type = 'user' AND followable_id = p_target_user_id;
    RETURN jsonb_build_object('ok', TRUE, 'isFollowing', v_is_following, 'followerCount', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow_user(BIGINT) TO authenticated;
