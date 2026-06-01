-- =============================================================================
-- 031 — Member skills trở thành "free-text riêng từng user"
-- -----------------------------------------------------------------------------
-- Bối cảnh: trước đây member_skills tham chiếu bảng danh mục dùng chung `skills`
-- (public read, ai đăng nhập cũng insert được). Hệ quả: kỹ năng một thành viên
-- gõ vào sẽ tạo một dòng global mà mọi tài khoản đều dùng chung — "không giới
-- hạn ai tạo ai dùng".
--
-- Sau migration này, mỗi thành viên tự lưu danh sách kỹ năng riêng (cột `name`
-- ngay trên member_skills), không còn phụ thuộc bảng `skills`. Bảng `skills` /
-- `job_skills` vẫn giữ nguyên cho phần kỹ năng yêu cầu của tin tuyển dụng.
-- =============================================================================

-- ---- 1. Cấu trúc lại bảng member_skills ------------------------------------
-- PK cũ là (user_id, skill_id) + FK fk_member_skill_skill. Ta thêm cột name,
-- backfill từ catalog cũ, rồi thay PK bằng surrogate id và bỏ skill_id.

ALTER TABLE public.member_skills ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Backfill tên kỹ năng từ catalog dùng chung (chỉ chạy khi còn skill_id)
DO $mig$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'member_skills'
       AND column_name = 'skill_id'
  ) THEN
    UPDATE public.member_skills ms
       SET name = s.name
      FROM public.skills s
     WHERE ms.skill_id = s.id
       AND ms.name IS NULL;
  END IF;
END $mig$;

-- Bỏ các dòng không backfill được (skill_id mồ côi) để có thể đặt NOT NULL
DELETE FROM public.member_skills WHERE name IS NULL;

-- Thêm surrogate id
ALTER TABLE public.member_skills ADD COLUMN IF NOT EXISTS id BIGSERIAL;

-- Gỡ PK + FK cũ trên skill_id
ALTER TABLE public.member_skills DROP CONSTRAINT IF EXISTS member_skills_pkey;
ALTER TABLE public.member_skills DROP CONSTRAINT IF EXISTS fk_member_skill_skill;

-- Bỏ cột skill_id, ràng buộc name
ALTER TABLE public.member_skills DROP COLUMN IF EXISTS skill_id;
ALTER TABLE public.member_skills ALTER COLUMN name SET NOT NULL;

-- PK mới + đảm bảo không trùng kỹ năng trong cùng một user
ALTER TABLE public.member_skills
  ADD CONSTRAINT member_skills_pkey PRIMARY KEY (id);
ALTER TABLE public.member_skills
  ADD CONSTRAINT uk_member_skill_user_name UNIQUE (user_id, name);

COMMENT ON TABLE public.member_skills IS
  'Kỹ năng riêng từng thành viên (free-text). RLS: admin_all + view if can_view_member_profile + owner write';

-- ---- 2. RLS giữ nguyên (đều dựa trên user_id) ------------------------------
-- member_skills_select / insert_own / update_own / delete_own / admin_all đã
-- chỉ tham chiếu user_id nên vẫn hợp lệ sau khi bỏ skill_id.

-- ---- 3. Redefine RPC đọc kỹ năng từ member_skills.name ----------------------
-- Hai hàm dưới copy nguyên từ migration 028 (mô hình tỉnh/xã 2 cấp), chỉ đổi
-- khối lấy v_skills: bỏ JOIN public.skills, đọc trực tiếp ms.id + ms.name.

CREATE OR REPLACE FUNCTION public.get_profile_detail(
    p_target_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me            BIGINT;
    v_target        public.users%ROWTYPE;
    v_is_owner      BOOLEAN;
    v_relation      JSONB;
    v_conn          RECORD;
    v_profile       JSONB;
    v_province      JSONB;
    v_ward      JSONB;
    v_is_visible    BOOLEAN;
    v_experiences   JSONB;
    v_educations    JSONB;
    v_skills        JSONB;
    v_follower_cnt  INT;
    v_is_following  BOOLEAN;
    v_visibility    TEXT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT * INTO v_target
      FROM public.users u
     WHERE u.id = p_target_user_id
       AND u.deleted_at IS NULL;

    IF v_target.id IS NULL THEN
        RETURN NULL;
    END IF;

    v_is_owner := (v_me = v_target.id);

    -- ---- Connection relation (hai chiều) -----------------------------------
    IF v_is_owner THEN
        v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn
          FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me)
         LIMIT 1;

        IF v_conn.id IS NULL THEN
            v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN
            v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN
            v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN
            v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN
            v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE
            v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id);
        END IF;
    END IF;

    -- ============================ COMPANY ===================================
    IF v_target.role = 'company' THEN
        SELECT to_jsonb(cp) INTO v_profile
          FROM public.company_profiles cp
         WHERE cp.user_id = v_target.id
           AND cp.deleted_at IS NULL;

        IF v_profile IS NULL THEN
            RETURN NULL;
        END IF;

        SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
          FROM public.company_profiles cp
          JOIN public.provinces pv ON pv.id = cp.province_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;

        SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
          FROM public.company_profiles cp
          JOIN public.wards dt ON dt.id = cp.ward_id
         WHERE cp.user_id = v_target.id AND cp.deleted_at IS NULL;

        SELECT COUNT(*)::INT INTO v_follower_cnt
          FROM public.follows f
         WHERE f.followable_type = 'company'
           AND f.followable_id = v_target.id;

        IF v_is_owner THEN
            v_is_following := FALSE;
        ELSE
            SELECT EXISTS(
                SELECT 1 FROM public.follows f
                 WHERE f.follower_id = v_me
                   AND f.followable_type = 'company'
                   AND f.followable_id = v_target.id
            ) INTO v_is_following;
        END IF;

        RETURN jsonb_build_object(
            'kind', 'company',
            'isOwner', v_is_owner,
            'relation', v_relation,
            'profile', v_profile,
            'email', v_target.email,
            'province', v_province,
            'ward', v_ward,
            'profileViewCount', v_target.profile_view_count,
            'connectionCount', v_target.connection_count,
            'followerCount', COALESCE(v_follower_cnt, 0),
            'isFollowing', COALESCE(v_is_following, FALSE)
        );
    END IF;

    -- ============================ MEMBER ====================================
    SELECT to_jsonb(mp) INTO v_profile
      FROM public.member_profiles mp
     WHERE mp.user_id = v_target.id
       AND mp.deleted_at IS NULL;

    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object('id', pv.id, 'name', pv.name) INTO v_province
      FROM public.member_profiles mp
      JOIN public.provinces pv ON pv.id = mp.province_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;

    SELECT jsonb_build_object('id', dt.id, 'name', dt.name) INTO v_ward
      FROM public.member_profiles mp
      JOIN public.wards dt ON dt.id = mp.ward_id
     WHERE mp.user_id = v_target.id AND mp.deleted_at IS NULL;

    v_visibility := v_profile ->> 'profile_visibility';
    v_is_visible := (v_visibility IS DISTINCT FROM 'private') OR v_is_owner;

    IF v_is_visible THEN
        SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
          INTO v_experiences
          FROM public.member_experiences e
         WHERE e.user_id = v_target.id AND e.deleted_at IS NULL;

        SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC), '[]'::jsonb)
          INTO v_educations
          FROM public.member_educations ed
         WHERE ed.user_id = v_target.id AND ed.deleted_at IS NULL;

        SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
          INTO v_skills
          FROM public.member_skills ms
         WHERE ms.user_id = v_target.id;
    ELSE
        v_experiences := '[]'::jsonb;
        v_educations  := '[]'::jsonb;
        v_skills      := '[]'::jsonb;
    END IF;

    RETURN jsonb_build_object(
        'kind', 'member',
        'isOwner', v_is_owner,
        'relation', v_relation,
        'profile', v_profile,
        'email', v_target.email,
        'province', v_province,
        'ward', v_ward,
        'profileViewCount', v_target.profile_view_count,
        'connectionCount', v_target.connection_count,
        'isVisible', v_is_visible,
        'experiences', COALESCE(v_experiences, '[]'::jsonb),
        'educations', COALESCE(v_educations, '[]'::jsonb),
        'skills', COALESCE(v_skills, '[]'::jsonb)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_edit_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me            BIGINT;
    v_email         TEXT;
    v_role          TEXT;
    v_profile       JSONB;
    v_province      JSONB;
    v_ward      JSONB;
    v_experiences   JSONB;
    v_educations    JSONB;
    v_skills        JSONB;
    v_cvs           JSONB;
    v_provinces     JSONB;
BEGIN
    SELECT u.id, u.email, u.role INTO v_me, v_email, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'member' THEN
        RETURN NULL;
    END IF;

    SELECT to_jsonb(mp) INTO v_profile
      FROM public.member_profiles mp
     WHERE mp.user_id = v_me
       AND mp.deleted_at IS NULL;

    IF v_profile IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object('id', p.id, 'name', p.name) INTO v_province
      FROM public.provinces p
     WHERE p.id = (v_profile->>'province_id')::BIGINT
     LIMIT 1;

    SELECT jsonb_build_object('id', d.id, 'name', d.name) INTO v_ward
      FROM public.wards d
     WHERE d.id = (v_profile->>'ward_id')::BIGINT
     LIMIT 1;

    SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
      INTO v_experiences
      FROM public.member_experiences e
     WHERE e.user_id = v_me
       AND e.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC NULLS LAST), '[]'::jsonb)
      INTO v_educations
      FROM public.member_educations ed
     WHERE ed.user_id = v_me
       AND ed.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
      INTO v_skills
      FROM public.member_skills ms
     WHERE ms.user_id = v_me;

    SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.is_default DESC, c.created_at DESC), '[]'::jsonb)
      INTO v_cvs
      FROM public.member_cvs c
     WHERE c.user_id = v_me
       AND c.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(
             jsonb_build_object(
               'id', p.id,
               'code', p.code,
               'name', p.name,
               'name_en', p.name_en,
               'sort_order', p.sort_order,
               'is_active', p.is_active
             )
             ORDER BY p.sort_order, p.name
           ), '[]'::jsonb)
      INTO v_provinces
      FROM public.provinces p
     WHERE p.is_active = TRUE
       AND p.deleted_at IS NULL;

    RETURN jsonb_build_object(
        'userId', v_me,
        'email', v_email,
        'profile', v_profile,
        'province', v_province,
        'ward', v_ward,
        'experiences', v_experiences,
        'educations', v_educations,
        'skills', v_skills,
        'cvs', v_cvs,
        'provinces', v_provinces
    );
END;
$$;
