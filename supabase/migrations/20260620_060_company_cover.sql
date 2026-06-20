-- Thêm cột cover_url cho company_profiles, tương tự member_profiles.cover_url.
-- Cho phép company upload ảnh bìa giống member.

ALTER TABLE company_profiles
  ADD COLUMN cover_url text;

-- Migration: thêm cover_url vào RPC get_company_public_overview
-- (nếu cần hiển thị ở trang public company)

CREATE OR REPLACE FUNCTION public.get_company_public_overview(
  p_slug text
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO ''
AS $$
DECLARE
  _result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'userId',       cp.user_id,
    'companyId',    cp.id,
    'name',         cp.name,
    'slug',         cp.slug,
    'logoUrl',      cp.logo_url,
    'coverUrl',     cp.cover_url,
    'about',        cp.about,
    'website',      cp.website,
    'phone',        cp.phone,
    'industry',     cp.industry,
    'size',         cp.size,
    'openToHire',   cp.open_to_hire,
    'verificationStatus', cp.verification_status,
    'provinceName', p.name,
    'wardName',     w.name,
    'businessAddress',      cp.business_address,
    'businessEmail',        cp.business_email,
    'representativeName',   cp.representative_name,
    'representativeTitle',  cp.representative_title,
    'createdAt',    cp.created_at
  )
  FROM company_profiles cp
  LEFT JOIN provinces p ON p.id = cp.province_id
  LEFT JOIN wards w ON w.id = cp.ward_id
  WHERE cp.slug = p_slug
    AND cp.deleted_at IS NULL
  INTO _result;

  IF _result IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'company', _result,
    'jobsCount',      (SELECT count(*)::int FROM jobs WHERE company_id = (_result->>'companyId')::int AND status = 'active' AND deleted_at IS NULL),
    'followerCount',  (SELECT count(*)::int FROM company_followers WHERE company_id = (_result->>'companyId')::int),
    'isFollowing',    false,
    'isOwner',        false,
    'jobs',           COALESCE((SELECT jsonb_agg(
                                  jsonb_build_object(
                                    'id',           j.id,
                                    'title',        j.title,
                                    'salaryMin',    j.salary_min,
                                    'salaryMax',    j.salary_max,
                                    'salaryVisible', j.salary_visible,
                                    'provinceName', p.name,
                                    'wardName',     w.name,
                                    'jobTypeName',  jt.name,
                                    'workModeName', wm.name,
                                    'createdAt',    j.created_at
                                  )
                                  ORDER BY j.created_at DESC
                                  LIMIT 50
                                )
                                FROM jobs j
                                LEFT JOIN provinces p ON p.id = j.province_id
                                LEFT JOIN wards w ON w.id = j.ward_id
                                LEFT JOIN job_types jt ON jt.id = j.job_type_id
                                LEFT JOIN work_modes wm ON wm.id = j.work_mode_id
                                WHERE j.company_id = (_result->>'companyId')::int
                                  AND j.status = 'active'
                                  AND j.deleted_at IS NULL), '[]'::jsonb)
  );
END;
$$;
