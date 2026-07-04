-- Migration 058: Change Job/App RPCs to SECURITY DEFINER to bypass RLS errors

CREATE OR REPLACE FUNCTION public.apply_to_job(
    p_job_id BIGINT, p_cover_letter TEXT, p_resume_url TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_job_status TEXT; v_job_expires TIMESTAMPTZ; v_application_id BIGINT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly'); END IF;
    SELECT status, expires_at INTO v_job_status, v_job_expires
      FROM public.jobs WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;
    IF v_job_status IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_job_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotActive'); END IF;
    IF v_job_expires IS NOT NULL AND v_job_expires <= NOW() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobExpired'); END IF;
    IF EXISTS(SELECT 1 FROM public.job_applications WHERE job_id = p_job_id AND applicant_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'alreadyApplied'); END IF;
    IF p_cover_letter IS NOT NULL AND char_length(p_cover_letter) > 5000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'coverLetterTooLong'); END IF;
    INSERT INTO public.job_applications(job_id, applicant_id, resume_url, cover_letter, status)
    VALUES (p_job_id, v_me, NULLIF(btrim(COALESCE(p_resume_url, '')), ''),
            NULLIF(btrim(COALESCE(p_cover_letter, '')), ''), 'applied')
    RETURNING id INTO v_application_id;
    INSERT INTO public.application_status_history(application_id, old_status, new_status, changed_by, note)
    VALUES (v_application_id, NULL, 'applied', v_me, NULL);
    RETURN jsonb_build_object('ok', TRUE, 'applicationId', v_application_id, 'status', 'applied');
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(BIGINT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_company_applicants(
    p_job_id BIGINT DEFAULT NULL, p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL, p_limit INT DEFAULT 50, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');
    WITH base AS (
        SELECT a.id AS application_id, a.applicant_id, a.status, a.applied_at,
               a.cover_letter, a.resume_url, j.id AS job_id, j.title AS job_title,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline
          FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
           AND (p_job_id IS NULL OR a.job_id = p_job_id)
           AND (p_status = 'all' OR a.status = p_status)
           AND (v_q IS NULL OR COALESCE(mp.full_name, cp.name, u.email) ILIKE '%' || v_q || '%'
             OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (SELECT * FROM base ORDER BY applied_at DESC LIMIT v_lim OFFSET v_off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('applicationId', p.application_id, 'applicantId', p.applicant_id,
        'displayName', p.display_name, 'avatarUrl', p.avatar_url, 'headline', p.headline,
        'jobId', p.job_id, 'jobTitle', p.job_title, 'status', p.status, 'appliedAt', p.applied_at,
        'coverLetter', p.cover_letter, 'resumeUrl', p.resume_url) ORDER BY p.applied_at DESC), '[]'::jsonb),
        (SELECT total FROM counted) INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_applicants(BIGINT, TEXT, TEXT, INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_applications(p_limit INT DEFAULT 30, p_offset INT DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE v_me BIGINT; v_items JSONB; v_total INT; v_lim INT; v_off INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 30), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    WITH base AS (
        SELECT a.id AS application_id, a.status, a.applied_at, a.updated_at,
               j.id AS job_id, j.title AS job_title, j.status AS job_status, j.company_user_id,
               COALESCE(cp.name, cu.email) AS company_name, cp.logo_url AS company_logo_url
          FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users cu ON cu.id = j.company_user_id
          LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
         WHERE a.applicant_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (SELECT * FROM base ORDER BY updated_at DESC LIMIT v_lim OFFSET v_off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('applicationId', p.application_id, 'status', p.status,
        'appliedAt', p.applied_at, 'updatedAt', p.updated_at, 'jobId', p.job_id, 'jobTitle', p.job_title,
        'jobStatus', p.job_status, 'companyUserId', p.company_user_id, 'companyName', p.company_name,
        'companyLogoUrl', p.company_logo_url,
        'interview', (SELECT jsonb_build_object('id', s.id, 'scheduledAt', s.scheduled_at,
            'durationMinutes', s.duration_minutes, 'locationOrLink', s.location_or_link,
            'note', s.note, 'status', s.status)
            FROM public.interview_schedules s WHERE s.application_id = p.application_id
            ORDER BY s.scheduled_at DESC LIMIT 1),
        'history', (SELECT COALESCE(jsonb_agg(jsonb_build_object('oldStatus', h.old_status,
            'newStatus', h.new_status, 'changedAt', h.changed_at, 'note', h.note)
            ORDER BY h.changed_at), '[]'::jsonb)
            FROM public.application_status_history h WHERE h.application_id = p.application_id)
    ) ORDER BY p.updated_at DESC), '[]'::jsonb), (SELECT total FROM counted)
      INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_applications(INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id BIGINT, p_new_status TEXT, p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_company_user_id BIGINT; v_old_status TEXT; v_now TIMESTAMPTZ;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF p_new_status NOT IN ('applied','reviewed','interview','offered','hired','rejected','withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    SELECT j.company_user_id, a.status INTO v_company_user_id, v_old_status
      FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = p_application_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF p_new_status = 'withdrawn' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdraw'); END IF;
    IF v_old_status = p_new_status THEN RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status); END IF;
    v_now := NOW();
    UPDATE public.job_applications SET status = p_new_status, updated_at = v_now WHERE id = p_application_id;
    INSERT INTO public.application_status_history(application_id, old_status, new_status, changed_by, note, changed_at)
    VALUES (p_application_id, v_old_status, p_new_status, v_me, NULLIF(btrim(COALESCE(p_note, '')), ''), v_now);
    RETURN jsonb_build_object('ok', TRUE, 'noop', FALSE, 'status', p_new_status, 'oldStatus', v_old_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_application_status(BIGINT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.withdraw_application(p_application_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_applicant BIGINT; v_old_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    SELECT applicant_id, status INTO v_applicant, v_old_status
      FROM public.job_applications WHERE id = p_application_id LIMIT 1;
    IF v_applicant IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound'); END IF;
    IF v_applicant <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status IN ('withdrawn','hired','rejected') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdrawNow'); END IF;
    UPDATE public.job_applications SET status = 'withdrawn', updated_at = NOW() WHERE id = p_application_id;
    INSERT INTO public.application_status_history(application_id, old_status, new_status, changed_by, note)
    VALUES (p_application_id, v_old_status, 'withdrawn', v_me, NULL);
    RETURN jsonb_build_object('ok', TRUE, 'status', 'withdrawn');
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_application(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_job_detail(p_job_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_job JSONB; v_skills JSONB; v_viewer JSONB; v_company_user_id BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT jsonb_build_object('id', j.id, 'title', j.title, 'description', j.description,
        'requirements', j.requirements, 'salaryMin', j.salary_min, 'salaryMax', j.salary_max,
        'salaryVisible', j.salary_visible, 'status', j.status, 'createdAt', j.created_at,
        'expiresAt', j.expires_at, 'companyUserId', j.company_user_id,
        'companyName', COALESCE(cp.name, u.email), 'companyLogoUrl', cp.logo_url,
        'companyIndustry', cp.industry, 'companyAbout', cp.about, 'companySize', cp.size,
        'companyVerified', cp.verification_status = 'verified', 'provinceName', pv.name,
        'wardName', dt.name, 'jobTypeName', jt.name, 'workModeName', wm.name,
        'jobPositionName', jp.name), j.company_user_id
      INTO v_job, v_company_user_id
      FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id
      LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
      LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards dt ON dt.id = j.ward_id
      LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
      LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
      LEFT JOIN public.job_positions jp ON jp.id = j.job_position_id
     WHERE j.id = p_job_id AND j.deleted_at IS NULL;
    IF v_job IS NULL THEN RETURN NULL; END IF;
    SELECT COALESCE(jsonb_agg(s.name ORDER BY s.name), '[]'::jsonb) INTO v_skills
      FROM public.job_skills js JOIN public.skills s ON s.id = js.skill_id WHERE js.job_id = p_job_id;
    IF v_me IS NULL THEN
        v_viewer := jsonb_build_object('isOwner', FALSE, 'viewerSaved', FALSE,
            'viewerApplied', FALSE, 'applicationStatus', NULL, 'applicationId', NULL);
    ELSE
        v_viewer := jsonb_build_object('isOwner', v_me = v_company_user_id,
            'viewerSaved', EXISTS(SELECT 1 FROM public.saved_jobs s WHERE s.user_id = v_me AND s.job_id = p_job_id),
            'viewerApplied', EXISTS(SELECT 1 FROM public.job_applications a WHERE a.applicant_id = v_me AND a.job_id = p_job_id),
            'applicationStatus', (SELECT a.status FROM public.job_applications a WHERE a.applicant_id = v_me AND a.job_id = p_job_id LIMIT 1),
            'applicationId', (SELECT a.id FROM public.job_applications a WHERE a.applicant_id = v_me AND a.job_id = p_job_id LIMIT 1));
    END IF;
    RETURN jsonb_build_object('job', v_job, 'skills', v_skills, 'viewer', v_viewer);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_detail(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_company_jobs(
    p_status TEXT DEFAULT 'all', p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');
    WITH base AS (
        SELECT j.*, CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL AND j.expires_at <= NOW()
                         THEN 'expired' ELSE j.status END AS effective_status
          FROM public.jobs j WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
           AND (p_status = 'all' OR (CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                 AND j.expires_at <= NOW() THEN 'expired' ELSE j.status END) = p_status)
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT b.id, b.title, b.effective_status AS status, b.created_at, b.expires_at,
               (SELECT COUNT(*)::INT FROM public.job_applications a WHERE a.job_id = b.id) AS applicant_count,
               (SELECT COUNT(*)::INT FROM public.job_view_logs v WHERE v.job_id = b.id) AS view_count
          FROM base b ORDER BY b.created_at DESC LIMIT v_lim OFFSET v_off
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title, 'status', p.status,
        'createdAt', p.created_at, 'expiresAt', p.expires_at, 'applicantCount', p.applicant_count,
        'viewCount', p.view_count) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted) INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_jobs(TEXT, TEXT, INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_job_status(p_job_id BIGINT, p_new_status TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_company_user_id BIGINT; v_old_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF p_new_status NOT IN ('draft','active','closed') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    SELECT j.company_user_id, j.status INTO v_company_user_id, v_old_status
      FROM public.jobs j WHERE j.id = p_job_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status = 'removed' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobRemoved'); END IF;
    IF v_old_status = p_new_status THEN RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status); END IF;
    UPDATE public.jobs SET status = p_new_status, updated_at = NOW() WHERE id = p_job_id;
    RETURN jsonb_build_object('ok', TRUE, 'noop', FALSE, 'status', p_new_status, 'oldStatus', v_old_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_status(BIGINT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.respond_interview(p_interview_id BIGINT, p_accept BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_applicant_id BIGINT; v_company_user_id BIGINT;
    v_job_id BIGINT; v_job_title TEXT; v_application_id BIGINT; v_new_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    SELECT a.applicant_id, j.company_user_id, j.id, j.title, a.id
      INTO v_applicant_id, v_company_user_id, v_job_id, v_job_title, v_application_id
      FROM public.interview_schedules s
      JOIN public.job_applications a ON a.id = s.application_id
      JOIN public.jobs j ON j.id = a.job_id
     WHERE s.id = p_interview_id LIMIT 1;
    IF v_applicant_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'interviewNotFound'); END IF;
    IF v_applicant_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    v_new_status := CASE WHEN p_accept THEN 'confirmed' ELSE 'declined' END;
    UPDATE public.interview_schedules SET status = v_new_status, responded_at = NOW(), updated_at = NOW()
     WHERE id = p_interview_id;
    RETURN jsonb_build_object('ok', TRUE, 'status', v_new_status,
        'companyUserId', v_company_user_id, 'jobId', v_job_id,
        'jobTitle', v_job_title, 'applicationId', v_application_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_interview(BIGINT, BOOLEAN) TO authenticated;

