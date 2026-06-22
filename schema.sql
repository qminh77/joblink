-- =============================================================================
-- JOBLINK DATABASE SCHEMA — HỢP NHẤT (AUTHORITATIVE)
-- PostgreSQL / Supabase
-- Charset: UTF8
-- 
-- ⮕ FILE DUY NHẤT: gộp từ TOÀN BỘ supabase/migrations (đến 20260621_072).
-- ⮕ ĐÃ LOẠI các bảng legacy không dùng.
-- ⮕ ĐÃ SỬA: create_job (FOREACH thiếu END LOOP), is_connected_with (thêm mới),
--   interview_schedules (giữ lại vì schedule_interview dùng), storage uploads/cvs.
-- =============================================================================

-- =============================================================================
-- 0. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 0.5. HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION row_to_jsonb(ANYELEMENT)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT to_jsonb($1);
$$;

-- =============================================================================
-- 1. USERS & AUTH
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id                BIGSERIAL PRIMARY KEY,
    auth_id           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL,
    account_type      VARCHAR(20)  NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'pending_verification',
    email_verified_at TIMESTAMPTZ NULL,
    phone             VARCHAR(20)  NULL,
    phone_verified_at TIMESTAMPTZ NULL,
    two_fa_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_secret     VARCHAR(255) NULL,
    locale            VARCHAR(10)  NOT NULL DEFAULT 'vi',
    last_login_at     TIMESTAMPTZ NULL,
    connection_count   INT NOT NULL DEFAULT 0,
    profile_view_count INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_account_type CHECK (account_type IN ('member','company','admin')),
    CONSTRAINT chk_users_status CHECK (status IN
        ('pending_verification','active','suspended','banned','deleted'))
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_user_id BIGINT;
  v_role TEXT;
  v_name TEXT;
  v_avatar TEXT;
  v_company_name TEXT;
  v_slug_base TEXT;
BEGIN
  v_role := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('member', 'company', 'admin')
      THEN NEW.raw_user_meta_data->>'role'
    ELSE 'member'
  END;

  INSERT INTO public.users (auth_id, email, account_type, status, email_verified_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_role,
    'active',
    COALESCE(NEW.email_confirmed_at, NOW())
  )
  ON CONFLICT (auth_id) DO UPDATE
     SET email = EXCLUDED.email,
         email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at, NOW()),
         status = CASE
           WHEN public.users.status = 'pending_verification' THEN 'active'
           ELSE public.users.status
         END,
         updated_at = NOW()
  RETURNING id INTO v_new_user_id;

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Thành viên'
  );

  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', '')
  );

  IF v_role = 'company' THEN
    v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), v_name, 'Company');
    v_slug_base := COALESCE(
      NULLIF(trim(both '-' FROM regexp_replace(lower(v_company_name), '[^a-z0-9]+', '-', 'g')), ''),
      'company'
    );

    INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
    VALUES (
      v_new_user_id,
      v_company_name,
      v_slug_base || '-' || substring(NEW.id::text, 1, 8),
      v_avatar
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_role = 'member' THEN
    INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
    VALUES (v_new_user_id, v_name, v_avatar)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_user_email_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email
     OR NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.users u
    SET email = NEW.email,
        email_verified_at = NEW.email_confirmed_at,
        status = CASE
          WHEN u.status = 'pending_verification'
               AND NEW.email_confirmed_at IS NOT NULL THEN 'active'
          ELSE u.status
        END,
        updated_at = NOW()
    WHERE u.auth_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id FROM public.users u
   WHERE u.auth_id::text = auth.uid()::text
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_id() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.auth_id::text = auth.uid()::text
       AND u.account_type = 'admin'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- =============================================================================
-- 1.5. LOOKUP CATEGORIES
-- =============================================================================
CREATE TABLE IF NOT EXISTS provinces (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(20)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120) NULL,
    sort_order  INT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ NULL,
    CONSTRAINT uk_provinces_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS wards (
    id          BIGSERIAL PRIMARY KEY,
    province_id BIGINT       NOT NULL,
    code        VARCHAR(20)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120) NULL,
    sort_order  INT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ NULL,
    CONSTRAINT uk_wards_code UNIQUE (code),
    CONSTRAINT fk_ward_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_types (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120) NULL,
    sort_order  INT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ NULL,
    CONSTRAINT uk_job_types_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS work_modes (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(30)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    name_en     VARCHAR(120) NULL,
    sort_order  INT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ NULL,
    CONSTRAINT uk_work_modes_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS job_positions (
    id          BIGSERIAL PRIMARY KEY,
    parent_id   BIGINT       NULL,
    code        VARCHAR(60)  NOT NULL,
    name        VARCHAR(160) NOT NULL,
    name_en     VARCHAR(160) NULL,
    description TEXT         NULL,
    sort_order  INT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ NULL,
    CONSTRAINT uk_job_positions_code UNIQUE (code),
    CONSTRAINT fk_job_position_parent FOREIGN KEY (parent_id) REFERENCES job_positions(id) ON DELETE SET NULL
);

-- =============================================================================
-- 2. MEMBER PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS member_profiles (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL,
    full_name          VARCHAR(255) NOT NULL,
    avatar_url         TEXT NULL,
    cover_url          TEXT NULL,
    headline           VARCHAR(255) NULL,
    about              TEXT NULL,
    province_id        BIGINT NULL,
    ward_id            BIGINT NULL,
    website            TEXT NULL,
    open_to_work       BOOLEAN NOT NULL DEFAULT FALSE,
    profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ NULL,
    CONSTRAINT uk_member_profile_user UNIQUE (user_id),
    CONSTRAINT chk_member_visibility CHECK (profile_visibility IN ('public','connections','private')),
    CONSTRAINT fk_member_profile_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_member_profile_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
    CONSTRAINT fk_member_profile_ward FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS member_experiences (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    position     VARCHAR(255) NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NULL,
    is_current   BOOLEAN NOT NULL DEFAULT FALSE,
    description  TEXT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ NULL,
    CONSTRAINT fk_member_exp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS member_educations (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    school_name    VARCHAR(255) NOT NULL,
    degree         VARCHAR(160) NULL,
    field_of_study VARCHAR(160) NULL,
    start_date     DATE NULL,
    end_date       DATE NULL,
    description    TEXT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ NULL,
    CONSTRAINT fk_member_edu_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT uk_skills_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS member_skills (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL,
    name              VARCHAR(100) NOT NULL,
    endorsement_count INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_member_skill_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_member_skill_user_name UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS profile_view_logs (
    id             BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT NOT NULL,
    viewer_user_id BIGINT NULL,
    viewed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pvl_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pvl_viewer FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS member_cvs (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    file_name      VARCHAR(160) NOT NULL,
    storage_path   TEXT NOT NULL,
    file_size      INT NOT NULL,
    mime_type      VARCHAR(80) NOT NULL DEFAULT 'application/pdf',
    source         VARCHAR(20) NOT NULL DEFAULT 'upload',
    builder_config JSONB NULL,
    is_default     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ NULL,
    CONSTRAINT fk_member_cv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_member_cv_size CHECK (file_size > 0 AND file_size <= 5 * 1024 * 1024),
    CONSTRAINT chk_member_cv_mime CHECK (mime_type = 'application/pdf'),
    CONSTRAINT chk_member_cv_source CHECK (source IN ('upload', 'builder')),
    CONSTRAINT uk_member_cv_path UNIQUE (storage_path)
);

-- =============================================================================
-- 3. COMPANY PROFILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS company_profiles (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT NOT NULL,
    name                   VARCHAR(255) NOT NULL,
    slug                   VARCHAR(255) NOT NULL,
    logo_url               TEXT NULL,
    cover_url              TEXT NULL,
    about                  TEXT NULL,
    website                TEXT NULL,
    province_id            BIGINT NULL,
    ward_id                BIGINT NULL,
    industry               VARCHAR(160) NULL,
    size                   VARCHAR(30)  NULL,
    open_to_hire           BOOLEAN NOT NULL DEFAULT FALSE,
    tax_id                 VARCHAR(50)  NULL,
    representative_name    VARCHAR(255) NULL,
    representative_title   VARCHAR(160) NULL,
    business_address       TEXT NULL,
    business_email         VARCHAR(255) NULL,
    phone                  VARCHAR(20)  NULL,
    verification_documents JSONB NULL,
    verification_status    VARCHAR(30)  NOT NULL DEFAULT 'pending',
    verification_note      TEXT NULL,
    verified_at            TIMESTAMPTZ NULL,
    verified_by            BIGINT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at             TIMESTAMPTZ NULL,
    CONSTRAINT uk_company_profile_user UNIQUE (user_id),
    CONSTRAINT uk_company_slug         UNIQUE (slug),
    CONSTRAINT chk_company_verification_status CHECK (verification_status IN
        ('pending','pending_update','verified','rejected','suspended')),
    CONSTRAINT fk_company_profile_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT fk_company_verified_by      FOREIGN KEY (verified_by) REFERENCES users(id)     ON DELETE SET NULL,
    CONSTRAINT fk_company_profile_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
    CONSTRAINT fk_company_profile_ward FOREIGN KEY (ward_id) REFERENCES wards(id) ON DELETE SET NULL
);

INSERT INTO public.users (auth_id, email, account_type, status, email_verified_at)
SELECT au.id,
       au.email,
       CASE
         WHEN au.raw_user_meta_data->>'role' IN ('member', 'company', 'admin')
           THEN au.raw_user_meta_data->>'role'
         ELSE 'member'
       END,
       'active',
       COALESCE(au.email_confirmed_at, NOW())
  FROM auth.users au
 WHERE au.email IS NOT NULL
ON CONFLICT (auth_id) DO UPDATE
SET email = EXCLUDED.email,
    email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at, NOW()),
    status = CASE
      WHEN public.users.status = 'pending_verification' THEN 'active'
      ELSE public.users.status
    END,
    updated_at = NOW();

INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
SELECT u.id,
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'full_name', ''),
         NULLIF(au.raw_user_meta_data->>'name', ''),
         split_part(u.email, '@', 1),
         'Thành viên'
       ),
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'avatar_url', ''),
         NULLIF(au.raw_user_meta_data->>'picture', '')
       )
  FROM public.users u
  JOIN auth.users au ON au.id = u.auth_id
 WHERE u.account_type = 'member'
   AND u.deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
SELECT u.id,
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'company_name', ''),
         NULLIF(au.raw_user_meta_data->>'name', ''),
         split_part(u.email, '@', 1),
         'Company'
       ),
       COALESCE(
         NULLIF(trim(both '-' FROM regexp_replace(
           lower(COALESCE(
             NULLIF(au.raw_user_meta_data->>'company_name', ''),
             NULLIF(au.raw_user_meta_data->>'name', ''),
             split_part(u.email, '@', 1),
             'Company'
           )),
           '[^a-z0-9]+', '-', 'g'
         )), ''),
         'company'
       ) || '-' || substring(u.auth_id::text, 1, 8),
       COALESCE(
         NULLIF(au.raw_user_meta_data->>'avatar_url', ''),
         NULLIF(au.raw_user_meta_data->>'picture', '')
       )
  FROM public.users u
  JOIN auth.users au ON au.id = u.auth_id
 WHERE u.account_type = 'company'
   AND u.deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- 4. POSTS & FEED
-- =============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id         BIGSERIAL PRIMARY KEY,
    author_id  BIGINT NOT NULL,
    content    TEXT NOT NULL,
    post_type  VARCHAR(20) NOT NULL DEFAULT 'text',
    media      JSONB NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    status     VARCHAR(20) NOT NULL DEFAULT 'active',
    reaction_count INT DEFAULT 0,
    comment_count  INT DEFAULT 0,
    share_count    INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_post_type       CHECK (post_type  IN ('text','image','video','article','poll')),
    CONSTRAINT chk_post_visibility CHECK (visibility IN ('public','connections','private')),
    CONSTRAINT chk_post_status     CHECK (status     IN ('active','hidden','deleted')),
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_options (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    vote_count  INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_poll_option_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_votes (
    id        BIGSERIAL PRIMARY KEY,
    post_id   BIGINT NOT NULL,
    option_id BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    voted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_poll_vote UNIQUE (post_id, user_id),
    CONSTRAINT fk_poll_vote_post   FOREIGN KEY (post_id)   REFERENCES posts(id)        ON DELETE CASCADE,
    CONSTRAINT fk_poll_vote_option FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
    CONSTRAINT fk_poll_vote_user   FOREIGN KEY (user_id)   REFERENCES users(id)        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_reactions (
    id            BIGSERIAL PRIMARY KEY,
    post_id       BIGINT NOT NULL,
    user_id       BIGINT NOT NULL,
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_post_reaction UNIQUE (post_id, user_id, reaction_type),
    CONSTRAINT chk_reaction_type CHECK (reaction_type IN ('like','celebrate','support','love','insightful','funny')),
    CONSTRAINT fk_reaction_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_comments (
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    parent_id  BIGINT NULL,
    content    TEXT NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_comment_status CHECK (status IN ('active','hidden','deleted')),
    CONSTRAINT fk_comment_post   FOREIGN KEY (post_id)   REFERENCES posts(id)         ON DELETE CASCADE,
    CONSTRAINT fk_comment_user   FOREIGN KEY (user_id)   REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES post_comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_shares (
    id              BIGSERIAL PRIMARY KEY,
    post_id         BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    comment_content TEXT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_share_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_share_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 5. NETWORK & CONNECTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS connections (
    id           BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    receiver_id  BIGINT NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ NULL,
    CONSTRAINT uk_connection_pair UNIQUE (requester_id, receiver_id),
    CONSTRAINT chk_connection_status CHECK (status IN ('pending','accepted','rejected','blocked')),
    CONSTRAINT chk_connection_self   CHECK (requester_id <> receiver_id),
    CONSTRAINT fk_conn_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conn_receiver  FOREIGN KEY (receiver_id)  REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
    id              BIGSERIAL PRIMARY KEY,
    follower_id     BIGINT NOT NULL,
    followable_type VARCHAR(30) NOT NULL,
    followable_id   BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_follow UNIQUE (follower_id, followable_type, followable_id),
    CONSTRAINT chk_follow_type CHECK (followable_type IN ('user','company')),
    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION public.is_connected_with(p_user_id BIGINT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections c
     WHERE c.status = 'accepted'
       AND ((c.requester_id = public.auth_user_id() AND c.receiver_id = p_user_id)
         OR (c.receiver_id = public.auth_user_id() AND c.requester_id = p_user_id))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_connected_with(BIGINT) TO authenticated;

DROP FUNCTION IF EXISTS public.can_view_post(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.are_connected(BIGINT, BIGINT) CASCADE;

CREATE OR REPLACE FUNCTION public.are_connected(p_a BIGINT, p_b BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.connections c
     WHERE c.status = 'accepted'
       AND ((c.requester_id = p_a AND c.receiver_id = p_b)
         OR (c.requester_id = p_b AND c.receiver_id = p_a))
  );
$$;

GRANT EXECUTE ON FUNCTION public.are_connected(BIGINT, BIGINT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_view_post(post_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.posts p
     WHERE p.id = can_view_post.post_id
       AND p.deleted_at IS NULL
       AND (
            p.visibility = 'public'
         OR p.author_id = public.auth_user_id()
         OR (p.visibility = 'connections'
             AND public.are_connected(public.auth_user_id(), p.author_id))
         OR public.is_admin()
       )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_post(BIGINT) TO anon, authenticated;

-- =============================================================================
-- 6. JOBS & RECRUITMENT
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id               BIGSERIAL PRIMARY KEY,
    company_user_id  BIGINT NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT NOT NULL,
    requirements     TEXT NULL,
    province_id      BIGINT NULL,
    ward_id          BIGINT NULL,
    salary_min       BIGINT NULL,
    salary_max       BIGINT NULL,
    salary_visible   BOOLEAN NOT NULL DEFAULT TRUE,
    job_type_id      BIGINT NOT NULL,
    work_mode_id     BIGINT NOT NULL,
    job_position_id  BIGINT NULL,
    position_title   VARCHAR(255) NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'draft',
    expires_at       TIMESTAMPTZ NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ NULL,
    CONSTRAINT chk_job_status CHECK (status IN ('draft','active','closed','expired','removed')),
    CONSTRAINT chk_job_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    CONSTRAINT fk_job_company  FOREIGN KEY (company_user_id) REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT fk_job_province FOREIGN KEY (province_id)     REFERENCES provinces(id)     ON DELETE SET NULL,
    CONSTRAINT fk_job_ward FOREIGN KEY (ward_id)     REFERENCES wards(id)     ON DELETE SET NULL,
    CONSTRAINT fk_job_type     FOREIGN KEY (job_type_id)     REFERENCES job_types(id)     ON DELETE RESTRICT,
    CONSTRAINT fk_job_mode     FOREIGN KEY (work_mode_id)    REFERENCES work_modes(id)    ON DELETE RESTRICT,
    CONSTRAINT fk_job_position FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_skills (
    job_id      BIGINT NOT NULL,
    skill_id    BIGINT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (job_id, skill_id),
    CONSTRAINT fk_job_skill_job   FOREIGN KEY (job_id)   REFERENCES jobs(id)   ON DELETE CASCADE,
    CONSTRAINT fk_job_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_applications (
    id           BIGSERIAL PRIMARY KEY,
    job_id       BIGINT NOT NULL,
    applicant_id BIGINT NOT NULL,
    resume_url   TEXT NULL,
    cover_letter TEXT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'applied',
    applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_job_application UNIQUE (job_id, applicant_id),
    CONSTRAINT chk_app_status CHECK (status IN ('applied','reviewed','interview','offered','hired','rejected','withdrawn')),
    CONSTRAINT fk_app_job       FOREIGN KEY (job_id)       REFERENCES jobs(id)  ON DELETE CASCADE,
    CONSTRAINT fk_app_applicant FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_status_history (
    id             BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    old_status     VARCHAR(20) NULL,
    new_status     VARCHAR(20) NOT NULL,
    changed_by     BIGINT NULL,
    note           TEXT NULL,
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_app_hist_app FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_app_hist_by  FOREIGN KEY (changed_by)     REFERENCES users(id)            ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS interview_schedules (
    id               BIGSERIAL PRIMARY KEY,
    application_id   BIGINT NOT NULL,
    scheduled_at     TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    location_or_link TEXT NULL,
    note             TEXT NULL,
    created_by       BIGINT NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    responded_at     TIMESTAMPTZ NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_interview_status CHECK (status IN ('scheduled','confirmed','declined')),
    CONSTRAINT fk_interview_app FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE,
    CONSTRAINT fk_interview_by  FOREIGN KEY (created_by)     REFERENCES users(id)            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id    BIGINT NOT NULL,
    job_id     BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, job_id),
    CONSTRAINT fk_saved_job_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_job_job  FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_alerts (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL,
    name             VARCHAR(160) NULL,
    filters          JSONB NOT NULL,
    alert_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    last_notified_at TIMESTAMPTZ NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_job_alert_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_view_logs (
    id             BIGSERIAL PRIMARY KEY,
    job_id         BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    viewer_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    viewed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 7. MESSAGING
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(20) NOT NULL DEFAULT 'direct',
    seq        INT NOT NULL DEFAULT 0,
    last_message_id       BIGINT,
    last_content          TEXT,
    last_sender_id        BIGINT,
    last_message_created_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_conversation_type CHECK (type IN ('direct'))
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ NULL,
    unread_count    INT DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id),
    CONSTRAINT fk_conv_part_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_part_user FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id       BIGINT NOT NULL,
    receiver_id     BIGINT NULL,
    content         TEXT NULL,
    media           JSONB NULL,
    read_at         TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ NULL,
    CONSTRAINT fk_msg_conv   FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT fk_msg_receiver FOREIGN KEY (receiver_id)   REFERENCES users(id)         ON DELETE CASCADE
);

ALTER TABLE ONLY public.conversations
  ADD CONSTRAINT fk_conv_last_message FOREIGN KEY (last_message_id) REFERENCES public.messages(id);

CREATE TABLE IF NOT EXISTS user_blocks (
    id         BIGSERIAL PRIMARY KEY,
    blocker_id BIGINT NOT NULL,
    blocked_id BIGINT NOT NULL,
    reason     VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_block_self CHECK (blocker_id <> blocked_id),
    CONSTRAINT fk_block_blocker FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_block_blocked FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 8. NOTIFICATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    type       VARCHAR(80) NOT NULL,
    title      VARCHAR(255) NULL,
    payload    JSONB NULL,
    read_at    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL,
    type            VARCHAR(80) NOT NULL,
    in_app_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_notif_pref UNIQUE (user_id, type),
    CONSTRAINT fk_notif_pref_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================================================
-- 9. REPORTS & MODERATION
-- =============================================================================
CREATE TABLE IF NOT EXISTS report_types (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(60)  NOT NULL,
    name        VARCHAR(160) NOT NULL,
    name_en     VARCHAR(160) NULL,
    sort_order  INT     NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_report_types_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS reports (
    id          BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    target_type VARCHAR(30) NOT NULL,
    target_id   BIGINT NOT NULL,
    reason      VARCHAR(80) NOT NULL,
    description TEXT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    assigned_to BIGINT NULL,
    resolved_by BIGINT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_report_target CHECK (target_type IN ('user','post','comment','job','company')),
    CONSTRAINT chk_report_status CHECK (status      IN ('pending','in_review','resolved','dismissed')),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_report_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS moderation_actions (
    id           BIGSERIAL PRIMARY KEY,
    report_id    BIGINT NULL,
    moderator_id BIGINT NOT NULL,
    target_type  VARCHAR(30) NOT NULL,
    target_id    BIGINT NOT NULL,
    action_type  VARCHAR(20) NOT NULL,
    reason       TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_moderation_type CHECK (action_type IN
        ('hide','delete','warn','suspend','ban','restore','dismiss')),
    CONSTRAINT fk_moderation_report    FOREIGN KEY (report_id)    REFERENCES reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_moderation_moderator FOREIGN KEY (moderator_id) REFERENCES users(id)   ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS appeals (
    id                   BIGSERIAL PRIMARY KEY,
    appellant_id         BIGINT NOT NULL,
    report_id            BIGINT NULL,
    moderation_action_id BIGINT NULL,
    reason               TEXT NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by          BIGINT NULL,
    reviewed_at          TIMESTAMPTZ NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_appeal_status CHECK (status IN ('pending','accepted','rejected')),
    CONSTRAINT fk_appeal_user     FOREIGN KEY (appellant_id)         REFERENCES users(id)              ON DELETE CASCADE,
    CONSTRAINT fk_appeal_report   FOREIGN KEY (report_id)            REFERENCES reports(id)            ON DELETE SET NULL,
    CONSTRAINT fk_appeal_mod_act  FOREIGN KEY (moderation_action_id) REFERENCES moderation_actions(id) ON DELETE SET NULL,
    CONSTRAINT fk_appeal_reviewer FOREIGN KEY (reviewed_by)          REFERENCES users(id)              ON DELETE SET NULL
);

-- =============================================================================
-- 10. AUDIT LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    BIGINT NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id   BIGINT NULL,
    old_data    JSONB NULL,
    new_data    JSONB NULL,
    reason      TEXT NULL,
    ip_address  VARCHAR(45) NULL,
    user_agent  TEXT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- 11. SYSTEM SETTINGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id            BIGSERIAL PRIMARY KEY,
    setting_key   VARCHAR(120) NOT NULL,
    setting_group VARCHAR(60)  NOT NULL,
    value         JSONB NULL,
    encrypted     BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by    BIGINT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_system_setting UNIQUE (setting_key),
    CONSTRAINT fk_system_setting_user FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- 11.5 CONTACT SUBMISSIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    subject       VARCHAR(255) NOT NULL DEFAULT '',
    message       TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    user_id       BIGINT NULL,
    replied_at    TIMESTAMPTZ NULL,
    reply_message TEXT NULL,
    replied_by    BIGINT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ NULL,
    CONSTRAINT chk_contact_status CHECK (status IN ('pending','read','replied','closed')),
    CONSTRAINT fk_contact_user   FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_contact_replier FOREIGN KEY (replied_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_status     ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_deleted_at ON contact_submissions(deleted_at);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_submissions_insert_anon"
    ON contact_submissions FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "contact_submissions_select_admin"
    ON contact_submissions FOR SELECT
    USING (auth.jwt() ->> 'role' = 'service_role' OR
           auth.jwt() ->> 'aud' IN (SELECT aud FROM auth.users WHERE id = auth.uid())
           AND public.is_admin());

CREATE POLICY "contact_submissions_update_admin"
    ON contact_submissions FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- 12. O(1) ARCHITECTURE SUPPORT TABLES
-- =============================================================================
CREATE TABLE IF NOT EXISTS network_suggestions (
    user_id           BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    suggested_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score             INT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, suggested_user_id)
);

CREATE TABLE IF NOT EXISTS user_feeds (
    user_id    BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id    BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- #8: Rate Limiting — Theo dõi request per user per action
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type  TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('second', NOW()),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_select_own"
    ON public.rate_limits FOR SELECT
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

CREATE POLICY "rate_limits_insert_own"
    ON public.rate_limits FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

CREATE POLICY "rate_limits_admin_all"
    ON public.rate_limits FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- #4: Fan-out optimization — Theo dõi lần hoạt động cuối
CREATE TABLE IF NOT EXISTS public.user_last_active (
    user_id    BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    last_active TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_last_active ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_last_active_select_all"
    ON public.user_last_active FOR SELECT USING (true);

CREATE POLICY "user_last_active_insert_own"
    ON public.user_last_active FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

CREATE POLICY "user_last_active_update_own"
    ON public.user_last_active FOR UPDATE
    USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid() AND deleted_at IS NULL));

-- =============================================================================
-- 13. INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_status      ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_account_type_status ON users(account_type, status);
CREATE INDEX IF NOT EXISTS idx_users_active      ON users(account_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_active_recent ON users(status, account_type, deleted_at, created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active' AND account_type <> 'admin';

CREATE INDEX IF NOT EXISTS idx_provinces_active     ON provinces(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wards_province   ON wards(province_id)               WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wards_active     ON wards(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_types_active     ON job_types(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_modes_active    ON work_modes(is_active, sort_order)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_positions_parent ON job_positions(parent_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_positions_active ON job_positions(is_active, sort_order) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_member_profiles_user     ON member_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_otw      ON member_profiles(open_to_work) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_visibility ON member_profiles(profile_visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_province ON member_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_ward ON member_profiles(ward_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_full_name_trgm ON member_profiles USING gin (full_name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_headline_trgm ON member_profiles USING gin (headline gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_experiences_user  ON member_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_member_educations_user   ON member_educations(user_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_user       ON member_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_target      ON profile_view_logs(target_user_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_view_viewer      ON profile_view_logs(viewer_user_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_member_cvs_user          ON member_cvs(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_member_cvs_default_per_user ON member_cvs(user_id) WHERE is_default = TRUE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_company_profiles_verification ON company_profiles(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_oth          ON company_profiles(open_to_hire, verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_slug         ON company_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_company_profiles_province     ON company_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_ward     ON company_profiles(ward_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_name_trgm    ON company_profiles USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry_trgm ON company_profiles USING gin (industry gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_visibility     ON posts(visibility, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_status         ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_counts         ON posts(reaction_count DESC, comment_count DESC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post  ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post   ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_post      ON poll_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option    ON poll_votes(option_id);

CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver  ON connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_pair      ON connections(requester_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_req_status_requested_at ON connections(requester_id, status, receiver_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_recv_status_requested_at ON connections(receiver_id, status, requester_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_req_status_responded_at ON connections(requester_id, status, receiver_id, responded_at DESC);
CREATE INDEX IF NOT EXISTS idx_connections_recv_status_responded_at ON connections(receiver_id, status, requester_id, responded_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower      ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_target        ON follows(followable_type, followable_id);

CREATE INDEX IF NOT EXISTS idx_jobs_company       ON jobs(company_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status_expire ON jobs(status, expires_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_province      ON jobs(province_id);
CREATE INDEX IF NOT EXISTS idx_jobs_ward      ON jobs(ward_id);
CREATE INDEX IF NOT EXISTS idx_jobs_type          ON jobs(job_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode     ON jobs(work_mode_id);
CREATE INDEX IF NOT EXISTS idx_jobs_position      ON jobs(job_position_id);
CREATE INDEX IF NOT EXISTS idx_jobs_salary        ON jobs(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_jobs_active_company ON jobs(company_user_id) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm    ON jobs USING gin (title gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_active_created ON jobs(created_at DESC) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_company_active_created ON jobs(company_user_id, created_at DESC) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_company_status_created ON jobs(company_user_id, status, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_job_skills_job     ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill   ON job_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_job       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_applicant ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_status    ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_apps_job_status_applied ON job_applications(job_id, status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_history_app    ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user    ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user    ON job_alerts(user_id, alert_enabled);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_application ON interview_schedules(application_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_view_logs_job  ON job_view_logs(job_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user_lastread ON conversation_participants(user_id, last_read_at);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created  ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender        ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc ON messages(conversation_id, created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_messages_conv_sender_created ON messages(conversation_id, sender_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_updated_desc ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker    ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked    ON user_blocks(blocked_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_only ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user          ON notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_reports_status       ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target       ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter     ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned     ON reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_moderation_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_target    ON moderation_actions(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor     ON audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity    ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action    ON audit_logs(action, created_at);

CREATE INDEX IF NOT EXISTS idx_system_settings_group ON system_settings(setting_group);

CREATE INDEX IF NOT EXISTS idx_user_feeds_user_created ON user_feeds(user_id, created_at DESC);

-- #8: Rate Limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action
    ON public.rate_limits(user_id, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
    ON public.rate_limits(created_at);

-- #4: User last active index
CREATE INDEX IF NOT EXISTS idx_user_last_active
    ON public.user_last_active(last_active);

-- =============================================================================
-- 14. TRIGGER FUNCTIONS
-- =============================================================================

-- updated_at
CREATE OR REPLACE FUNCTION joblink_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit soft delete
CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_users() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'users', NEW.id,
           jsonb_build_object('email', OLD.email, 'role', OLD.account_type, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_posts() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'posts', NEW.id,
           jsonb_build_object('author_id', OLD.author_id, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_jobs() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'jobs', NEW.id,
           jsonb_build_object('company_user_id', OLD.company_user_id, 'title', OLD.title, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_company_profiles() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'company_profiles', NEW.id,
           jsonb_build_object('user_id', OLD.user_id, 'name', OLD.name, 'verification_status', OLD.verification_status));
  END IF;
  RETURN NEW;
END;
$$;

-- Messaging denormalization
CREATE OR REPLACE FUNCTION public.joblink_after_message_insert() RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
     SET updated_at = NEW.created_at,
         last_message_id = NEW.id,
         last_content = NEW.content,
         last_sender_id = NEW.sender_id,
         last_message_created_at = NEW.created_at
   WHERE id = NEW.conversation_id;
  UPDATE public.conversation_participants
     SET unread_count = unread_count + 1
   WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_unread_count_trigger() RETURNS trigger AS $$
BEGIN
  IF NEW.last_read_at IS NOT NULL AND (OLD.last_read_at IS NULL OR NEW.last_read_at > OLD.last_read_at) THEN
    NEW.unread_count = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Counter caches
CREATE OR REPLACE FUNCTION public.post_reaction_counter_trigger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.post_comment_counter_trigger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.post_share_counter_trigger() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET share_count = share_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET share_count = GREATEST(share_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.connections_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'accepted' THEN
      UPDATE public.users
         SET connection_count = connection_count + 1
       WHERE id IN (NEW.requester_id, NEW.receiver_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
        UPDATE public.users
           SET connection_count = connection_count + 1
         WHERE id IN (NEW.requester_id, NEW.receiver_id);
      ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
        UPDATE public.users
           SET connection_count = GREATEST(0, connection_count - 1)
         WHERE id IN (OLD.requester_id, OLD.receiver_id);
      END IF;
    END IF;

    IF NEW.status = 'accepted'
       AND OLD.status = 'accepted'
       AND (OLD.requester_id, OLD.receiver_id)
           IS DISTINCT FROM (NEW.requester_id, NEW.receiver_id) THEN
      UPDATE public.users
         SET connection_count = GREATEST(0, connection_count - 1)
       WHERE id IN (OLD.requester_id, OLD.receiver_id);
      UPDATE public.users
         SET connection_count = connection_count + 1
       WHERE id IN (NEW.requester_id, NEW.receiver_id);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'accepted' THEN
      UPDATE public.users
         SET connection_count = GREATEST(0, connection_count - 1)
       WHERE id IN (OLD.requester_id, OLD.receiver_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.profile_view_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
       SET profile_view_count = profile_view_count + 1
     WHERE id = NEW.target_user_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE public.users
       SET profile_view_count = GREATEST(0, profile_view_count - 1)
     WHERE id = OLD.target_user_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- #4: User last active trigger — cập nhật khi user đăng bài
CREATE OR REPLACE FUNCTION public.update_user_last_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_last_active (user_id, last_active)
  VALUES (NEW.author_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET last_active = NOW();
  RETURN NEW;
END;
$$;

-- Fan-out (HYBRID: chỉ active connections)
CREATE OR REPLACE FUNCTION public.fanout_post_to_feed() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status <> 'active' OR NEW.deleted_at IS NOT NULL THEN
      DELETE FROM public.user_feeds WHERE post_id = NEW.id;
      RETURN NEW;
    END IF;
    IF NEW.visibility NOT IN ('public', 'connections') THEN
      DELETE FROM public.user_feeds WHERE post_id = NEW.id AND user_id <> NEW.author_id;
    END IF;
  END IF;

  IF NEW.status = 'active' AND NEW.deleted_at IS NULL THEN
    INSERT INTO public.user_feeds (user_id, post_id, created_at)
    VALUES (NEW.author_id, NEW.id, NEW.created_at) ON CONFLICT DO NOTHING;
    IF NEW.visibility IN ('public', 'connections') THEN
      -- HYBRID: Chỉ fan-out cho connections có last_active trong 7 ngày
      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT ucv.to_user_id, NEW.id, NEW.created_at
        FROM public.user_connections_view ucv
        LEFT JOIN public.user_last_active ula ON ula.user_id = ucv.to_user_id
       WHERE ucv.from_user_id = NEW.author_id AND ucv.status = 'accepted'
         AND ula.last_active IS NOT NULL
         AND ula.last_active > NOW() - INTERVAL '7 days'
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_feeds_on_connection() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT NEW.requester_id, id, created_at FROM public.posts
       WHERE author_id = NEW.receiver_id AND status = 'active' AND deleted_at IS NULL
         AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
      ON CONFLICT DO NOTHING;

      INSERT INTO public.user_feeds (user_id, post_id, created_at)
      SELECT NEW.receiver_id, id, created_at FROM public.posts
       WHERE author_id = NEW.requester_id AND status = 'active' AND deleted_at IS NULL
         AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'accepted' THEN
        INSERT INTO public.user_feeds (user_id, post_id, created_at)
        SELECT NEW.requester_id, id, created_at FROM public.posts
         WHERE author_id = NEW.receiver_id AND status = 'active' AND deleted_at IS NULL
           AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
        ON CONFLICT DO NOTHING;

        INSERT INTO public.user_feeds (user_id, post_id, created_at)
        SELECT NEW.receiver_id, id, created_at FROM public.posts
         WHERE author_id = NEW.requester_id AND status = 'active' AND deleted_at IS NULL
           AND visibility IN ('public', 'connections') AND created_at > NOW() - INTERVAL '30 days'
        ON CONFLICT DO NOTHING;
      ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
        DELETE FROM public.user_feeds
         WHERE user_id = NEW.requester_id
           AND post_id IN (SELECT id FROM public.posts WHERE author_id = NEW.receiver_id);
        DELETE FROM public.user_feeds
         WHERE user_id = NEW.receiver_id
           AND post_id IN (SELECT id FROM public.posts WHERE author_id = NEW.requester_id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'accepted' THEN
      DELETE FROM public.user_feeds
       WHERE user_id = OLD.requester_id
         AND post_id IN (SELECT id FROM public.posts WHERE author_id = OLD.receiver_id);
      DELETE FROM public.user_feeds
       WHERE user_id = OLD.receiver_id
         AND post_id IN (SELECT id FROM public.posts WHERE author_id = OLD.requester_id);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- 15. TRIGGER APPLICATION
-- =============================================================================

CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_wards_set_updated_at
  BEFORE UPDATE ON wards FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_member_profiles_set_updated_at
  BEFORE UPDATE ON member_profiles FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_member_experiences_set_updated_at
  BEFORE UPDATE ON member_experiences FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_member_educations_set_updated_at
  BEFORE UPDATE ON member_educations FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_member_cvs_set_updated_at
  BEFORE UPDATE ON member_cvs FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_company_profiles_set_updated_at
  BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_posts_set_updated_at
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_post_comments_set_updated_at
  BEFORE UPDATE ON post_comments FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_jobs_set_updated_at
  BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();
CREATE TRIGGER trg_job_applications_set_updated_at
  BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_users_audit_soft_delete
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_users();
CREATE TRIGGER trg_posts_audit_soft_delete
  BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_posts();
CREATE TRIGGER trg_jobs_audit_soft_delete
  BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_jobs();
CREATE TRIGGER trg_company_profiles_audit_soft_delete
  BEFORE UPDATE ON company_profiles FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_company_profiles();

-- #4: User last active trigger — cập nhật khi user đăng bài
CREATE TRIGGER trg_update_last_active_on_post
  AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION public.update_user_last_active();

CREATE TRIGGER trg_messages_after_insert
  AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION public.joblink_after_message_insert();
CREATE TRIGGER trg_reset_unread_count
  BEFORE UPDATE ON conversation_participants FOR EACH ROW EXECUTE FUNCTION public.reset_unread_count_trigger();

CREATE TRIGGER trg_post_reaction_counter
  AFTER INSERT OR DELETE ON post_reactions FOR EACH ROW EXECUTE FUNCTION public.post_reaction_counter_trigger();
CREATE TRIGGER trg_post_comment_counter
  AFTER INSERT OR UPDATE OR DELETE ON post_comments FOR EACH ROW EXECUTE FUNCTION public.post_comment_counter_trigger();
CREATE TRIGGER trg_post_share_counter
  AFTER INSERT OR DELETE ON post_shares FOR EACH ROW EXECUTE FUNCTION public.post_share_counter_trigger();

CREATE TRIGGER trg_connections_counter
  AFTER INSERT OR UPDATE OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION public.connections_counter_trigger();
CREATE TRIGGER trg_sync_feeds_on_connection
  AFTER INSERT OR UPDATE OF status OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION public.sync_feeds_on_connection();
CREATE TRIGGER trg_poll_votes_counter
  AFTER INSERT OR DELETE ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.poll_votes_counter_trigger();
CREATE TRIGGER trg_profile_view_counter
  AFTER INSERT OR DELETE ON profile_view_logs
  FOR EACH ROW EXECUTE FUNCTION public.profile_view_counter_trigger();

CREATE TRIGGER trg_fanout_post
  AFTER INSERT OR UPDATE OF status, visibility, deleted_at ON posts
  FOR EACH ROW EXECUTE FUNCTION public.fanout_post_to_feed();

-- =============================================================================
-- 16. VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.user_connections_view
WITH (security_invoker = true) AS
SELECT requester_id AS from_user_id, receiver_id AS to_user_id, status,
       COALESCE(responded_at, requested_at) AS connected_at
  FROM public.connections
UNION ALL
SELECT receiver_id AS from_user_id, requester_id AS to_user_id, status,
       COALESCE(responded_at, requested_at) AS connected_at
  FROM public.connections;

CREATE OR REPLACE VIEW public.v_active_members
WITH (security_invoker = true) AS
SELECT u.id, u.auth_id, u.email, u.account_type, u.status,
       mp.full_name, mp.avatar_url, mp.headline,
       mp.province_id, p.name AS province_name,
       mp.ward_id, w.name AS ward_name,
       mp.open_to_work, mp.profile_visibility
  FROM public.users u
  JOIN public.member_profiles mp ON mp.user_id = u.id
  LEFT JOIN public.provinces p ON p.id = mp.province_id
  LEFT JOIN public.wards w ON w.id = mp.ward_id
 WHERE u.account_type = 'member'
   AND u.status = 'active'
   AND u.deleted_at IS NULL
   AND mp.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.v_verified_companies
WITH (security_invoker = true) AS
SELECT u.id, u.auth_id, u.email,
       cp.name, cp.slug, cp.logo_url, cp.industry, cp.size,
       cp.province_id, p.name AS province_name,
       cp.ward_id, w.name AS ward_name,
       cp.open_to_hire, cp.verified_at
  FROM public.users u
  JOIN public.company_profiles cp ON cp.user_id = u.id
  LEFT JOIN public.provinces p ON p.id = cp.province_id
  LEFT JOIN public.wards w ON w.id = cp.ward_id
 WHERE u.account_type = 'company'
   AND u.status = 'active'
   AND cp.verification_status = 'verified'
   AND u.deleted_at IS NULL
   AND cp.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.v_active_jobs
WITH (security_invoker = true) AS
SELECT j.*,
       cp.name AS company_name,
       cp.slug AS company_slug,
       cp.logo_url AS company_logo,
       p.name AS province_name,
       w.name AS ward_name,
       jt.code AS job_type_code,
       jt.name AS job_type_name,
       wm.code AS work_mode_code,
       wm.name AS work_mode_name,
       jp.name AS job_position_name
  FROM public.jobs j
  JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
  JOIN public.job_types jt ON jt.id = j.job_type_id
  JOIN public.work_modes wm ON wm.id = j.work_mode_id
  LEFT JOIN public.provinces p ON p.id = j.province_id
  LEFT JOIN public.wards w ON w.id = j.ward_id
  LEFT JOIN public.job_positions jp ON jp.id = j.job_position_id
 WHERE j.status = 'active'
   AND (j.expires_at IS NULL OR j.expires_at > NOW())
   AND j.deleted_at IS NULL
   AND cp.verification_status = 'verified';

CREATE OR REPLACE VIEW public.v_admin_audit_log
WITH (security_invoker = true) AS
SELECT a.id,
       a.actor_id,
       u.email AS actor_email,
       COALESCE(mp.full_name, cp.name, u.email) AS actor_name,
       a.action,
       a.entity_type,
       a.entity_id,
       a.old_data,
       a.new_data,
       a.reason,
       a.ip_address,
       a.user_agent,
       a.created_at
  FROM public.audit_logs a
  LEFT JOIN public.users u ON u.id = a.actor_id
  LEFT JOIN public.member_profiles mp ON mp.user_id = u.id AND mp.deleted_at IS NULL
  LEFT JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_status TEXT;
  v_seven_days TIMESTAMPTZ := NOW() - INTERVAL '7 days';
  v_stats JSONB;
  v_role_dist JSONB;
  v_status_dist JSONB;
  v_verif_dist JSONB;
  v_recent_acts JSONB;
BEGIN
  SELECT u.account_type, u.status
    INTO v_caller_role, v_caller_status
    FROM public.users u
   WHERE u.auth_id = auth.uid()
     AND u.deleted_at IS NULL
   LIMIT 1;

  IF v_caller_role IS DISTINCT FROM 'admin' OR v_caller_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
      'totalUsers', (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL),
      'newUsers7d', (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL AND created_at >= v_seven_days),
      'totalCompanies', (SELECT COUNT(*)::INT FROM public.users WHERE account_type = 'company' AND deleted_at IS NULL),
      'pendingCompanies', (SELECT COUNT(*)::INT FROM public.company_profiles WHERE verification_status IN ('pending','pending_update') AND deleted_at IS NULL),
      'totalJobs', (SELECT COUNT(*)::INT FROM public.jobs WHERE deleted_at IS NULL),
      'activeJobs', (SELECT COUNT(*)::INT FROM public.jobs WHERE status = 'active' AND deleted_at IS NULL),
      'totalApplications', (SELECT COUNT(*)::INT FROM public.job_applications),
      'pendingReports', (SELECT COUNT(*)::INT FROM public.reports WHERE status IN ('pending','in_review')),
      'totalPosts', (SELECT COUNT(*)::INT FROM public.posts WHERE deleted_at IS NULL AND status = 'active'),
      'totalConnections', (SELECT COUNT(*)::INT FROM public.connections WHERE status = 'accepted')
  ) INTO v_stats;

  SELECT COALESCE(jsonb_object_agg(account_type, cnt), '{}'::jsonb)
    INTO v_role_dist
    FROM (
      SELECT account_type, COUNT(*)::INT AS cnt
        FROM public.users
       WHERE deleted_at IS NULL
       GROUP BY account_type
    ) r;

  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
    INTO v_status_dist
    FROM (
      SELECT status, COUNT(*)::INT AS cnt
        FROM public.users
       WHERE deleted_at IS NULL
       GROUP BY status
    ) s;

  SELECT COALESCE(jsonb_object_agg(verification_status, cnt), '{}'::jsonb)
    INTO v_verif_dist
    FROM (
      SELECT verification_status, COUNT(*)::INT AS cnt
        FROM public.company_profiles
       WHERE deleted_at IS NULL
       GROUP BY verification_status
    ) v;

  SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.created_at DESC), '[]'::jsonb)
    INTO v_recent_acts
    FROM (
      SELECT a.id,
             a.action,
             a.entity_type AS "entityType",
             a.entity_id AS "entityId",
             a.reason,
             a.created_at AS "createdAt",
             jsonb_build_object(
               'id', u.id,
               'email', u.email,
               'displayName', COALESCE(mp.full_name, cp.name, u.email)
             ) AS actor
        FROM public.audit_logs a
        LEFT JOIN public.users u ON u.id = a.actor_id
        LEFT JOIN public.member_profiles mp ON mp.user_id = u.id AND mp.deleted_at IS NULL
        LEFT JOIN public.company_profiles cp ON cp.user_id = u.id AND cp.deleted_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT 10
    ) x;

  RETURN jsonb_build_object(
    'stats', v_stats,
    'roleDist', v_role_dist,
    'statusDist', v_status_dist,
    'verificationDist', v_verif_dist,
    'recentActions', v_recent_acts
  );
END;
$$;

-- =============================================================================
-- 17. RLS POLICIES
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.account_type = 'company'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_company_user(p_user_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.company_profiles cp ON cp.user_id = u.id
     WHERE u.id = p_user_id
       AND u.account_type = 'company'
       AND u.status = 'active'
       AND cp.verification_status = 'verified'
       AND cp.deleted_at IS NULL
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_company()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_verified_company_user(public.auth_user_id());
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.id = public.auth_user_id()
       AND u.account_type = 'member'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_member_profile(target_user_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_profiles mp
     WHERE mp.user_id = target_user_id
       AND mp.deleted_at IS NULL
       AND (
            public.is_admin()
         OR mp.user_id = public.auth_user_id()
         OR mp.profile_visibility = 'public'
         OR (mp.profile_visibility = 'connections'
             AND public.are_connected(public.auth_user_id(), mp.user_id))
       )
  );
$$;

CREATE OR REPLACE FUNCTION public.company_owns_job(p_job_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
     WHERE j.id = p_job_id
       AND j.company_user_id = public.auth_user_id()
       AND j.deleted_at IS NULL
       AND public.is_verified_company()
  );
$$;

CREATE OR REPLACE FUNCTION public.company_owns_application(p_application_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
     WHERE ja.id = p_application_id
       AND j.company_user_id = public.auth_user_id()
       AND j.deleted_at IS NULL
       AND public.is_verified_company()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_post(post_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.posts p
     WHERE p.id = can_view_post.post_id
       AND p.deleted_at IS NULL
       AND (
            public.is_admin()
         OR p.author_id = public.auth_user_id()
         OR (p.status = 'active' AND p.visibility = 'public')
         OR (p.status = 'active'
             AND p.visibility = 'connections'
             AND public.are_connected(public.auth_user_id(), p.author_id))
       )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_my_conversation(p_conversation_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id
       AND cp.user_id = public.auth_user_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_company() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_company_user(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_company() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_member() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_member_profile(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_owns_job(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_owns_application(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_post(BIGINT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_my_conversation(BIGINT) TO authenticated;

DO $rls$
DECLARE
  r RECORD;
  v_tables TEXT[] := ARRAY[
    'users','provinces','wards','job_types','work_modes','job_positions',
    'member_profiles','member_experiences','member_educations','skills',
    'member_skills','profile_view_logs','member_cvs','company_profiles',
    'posts','poll_options','poll_votes','post_reactions','post_comments',
    'post_shares','connections','follows','jobs','job_skills',
    'job_applications','application_status_history','interview_schedules',
    'saved_jobs','job_alerts','job_view_logs','conversations',
    'conversation_participants','messages','user_blocks','notifications',
    'notification_preferences','report_types','reports','moderation_actions',
    'appeals','audit_logs','system_settings','network_suggestions','user_feeds'
  ];
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = ANY (v_tables)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$rls$;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_admin_all ON public.users
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (id = public.auth_user_id());
CREATE POLICY users_select_active_authenticated ON public.users
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND status NOT IN ('banned', 'deleted'));
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (id = public.auth_user_id() AND deleted_at IS NULL AND public.is_active_user())
  WITH CHECK (id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY member_profiles_admin_all ON public.member_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_profiles_select_visible ON public.member_profiles
  FOR SELECT USING (
    user_id = public.auth_user_id()
    OR profile_visibility = 'public'
    OR (profile_visibility = 'connections'
        AND public.are_connected(public.auth_user_id(), user_id))
  );
CREATE POLICY member_profiles_insert_own ON public.member_profiles
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_profiles_update_own ON public.member_profiles
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_profiles_delete_own ON public.member_profiles
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY member_experiences_admin_all ON public.member_experiences
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_experiences_select_visible ON public.member_experiences
  FOR SELECT USING (public.can_view_member_profile(user_id));
CREATE POLICY member_experiences_insert_own ON public.member_experiences
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_experiences_update_own ON public.member_experiences
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_experiences_delete_own ON public.member_experiences
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY member_educations_admin_all ON public.member_educations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_educations_select_visible ON public.member_educations
  FOR SELECT USING (public.can_view_member_profile(user_id));
CREATE POLICY member_educations_insert_own ON public.member_educations
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_educations_update_own ON public.member_educations
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_educations_delete_own ON public.member_educations
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY skills_select_all ON public.skills FOR SELECT USING (TRUE);
CREATE POLICY skills_insert_authenticated ON public.skills
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY skills_admin_all ON public.skills
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY member_skills_admin_all ON public.member_skills
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_skills_select_visible ON public.member_skills
  FOR SELECT USING (public.can_view_member_profile(user_id));
CREATE POLICY member_skills_insert_own ON public.member_skills
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_skills_update_own ON public.member_skills
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_skills_delete_own ON public.member_skills
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY profile_view_logs_admin_all ON public.profile_view_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY profile_view_logs_select_target ON public.profile_view_logs
  FOR SELECT USING (target_user_id = public.auth_user_id());
CREATE POLICY profile_view_logs_insert_viewer ON public.profile_view_logs
  FOR INSERT WITH CHECK (viewer_user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY member_cvs_admin_all ON public.member_cvs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY member_cvs_select_own ON public.member_cvs
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY member_cvs_insert_own ON public.member_cvs
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_cvs_update_own ON public.member_cvs
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY member_cvs_delete_own ON public.member_cvs
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY company_profiles_admin_all ON public.company_profiles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY company_profiles_select_visible ON public.company_profiles
  FOR SELECT USING (
    user_id = public.auth_user_id()
    OR verification_status = 'verified'
  );
CREATE POLICY company_profiles_insert_own ON public.company_profiles
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_company());
CREATE POLICY company_profiles_update_own ON public.company_profiles
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_company())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_company());
CREATE POLICY company_profiles_delete_own ON public.company_profiles
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_company());

CREATE POLICY posts_admin_all ON public.posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY posts_select_visible ON public.posts
  FOR SELECT USING (public.can_view_post(id));
CREATE POLICY posts_insert_own ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (author_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY posts_update_own ON public.posts
  FOR UPDATE USING (
    author_id = public.auth_user_id()
    AND deleted_at IS NULL
    AND public.is_active_user()
  )
  WITH CHECK (author_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY posts_delete_own ON public.posts
  FOR DELETE USING (author_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY poll_options_admin_all ON public.poll_options
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY poll_options_select_visible ON public.poll_options
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY poll_options_insert_own ON public.poll_options
  FOR INSERT WITH CHECK (
    public.is_active_user()
    AND
    EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );
CREATE POLICY poll_options_update_own ON public.poll_options
  FOR UPDATE USING (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  )
  WITH CHECK (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );
CREATE POLICY poll_options_delete_own ON public.poll_options
  FOR DELETE USING (
    public.is_active_user()
    AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.author_id = public.auth_user_id())
  );

CREATE POLICY poll_votes_admin_all ON public.poll_votes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY poll_votes_select_visible ON public.poll_votes
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY poll_votes_insert_own ON public.poll_votes
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY poll_votes_delete_own ON public.poll_votes
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY post_reactions_admin_all ON public.post_reactions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY post_reactions_select_visible ON public.post_reactions
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY post_reactions_insert_own ON public.post_reactions
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY post_reactions_delete_own ON public.post_reactions
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY post_comments_admin_all ON public.post_comments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY post_comments_select_visible ON public.post_comments
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY post_comments_insert_own ON public.post_comments
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY post_comments_update_own ON public.post_comments
  FOR UPDATE USING (user_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY post_comments_delete_own ON public.post_comments
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY post_shares_admin_all ON public.post_shares
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY post_shares_select_visible ON public.post_shares
  FOR SELECT USING (public.can_view_post(post_id));
CREATE POLICY post_shares_insert_own ON public.post_shares
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user() AND public.can_view_post(post_id));
CREATE POLICY post_shares_delete_own ON public.post_shares
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY connections_admin_all ON public.connections
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY connections_select_involved ON public.connections
  FOR SELECT USING (requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id());
CREATE POLICY connections_insert_own ON public.connections
  FOR INSERT WITH CHECK (requester_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY connections_update_involved ON public.connections
  FOR UPDATE USING ((requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id()) AND public.is_active_user())
  WITH CHECK ((requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id()) AND public.is_active_user());
CREATE POLICY connections_delete_involved ON public.connections
  FOR DELETE USING ((requester_id = public.auth_user_id() OR receiver_id = public.auth_user_id()) AND public.is_active_user());

CREATE POLICY follows_admin_all ON public.follows
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY follows_select_all ON public.follows FOR SELECT USING (TRUE);
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
             AND u.account_type = 'member'
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
             AND u.account_type = 'company'
             AND u.status = 'active'
             AND u.deleted_at IS NULL
        )
      )
    )
  );
CREATE POLICY follows_delete_own ON public.follows
  FOR DELETE USING (follower_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY jobs_admin_all ON public.jobs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY jobs_select_visible ON public.jobs
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      (company_user_id = public.auth_user_id() AND public.is_verified_company())
      OR (
        status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
        AND public.is_verified_company_user(company_user_id)
      )
    )
  );
CREATE POLICY jobs_insert_own ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (company_user_id = public.auth_user_id() AND public.is_verified_company());
CREATE POLICY jobs_update_own ON public.jobs
  FOR UPDATE USING (
    company_user_id = public.auth_user_id()
    AND deleted_at IS NULL
    AND public.is_verified_company()
  )
  WITH CHECK (company_user_id = public.auth_user_id() AND public.is_verified_company());
CREATE POLICY jobs_delete_own ON public.jobs
  FOR DELETE USING (company_user_id = public.auth_user_id() AND public.is_verified_company());

CREATE POLICY job_skills_admin_all ON public.job_skills
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_skills_select_visible ON public.job_skills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
       WHERE j.id = job_id
         AND j.deleted_at IS NULL
         AND (
           public.company_owns_job(j.id)
           OR (
             j.status = 'active'
             AND (j.expires_at IS NULL OR j.expires_at > NOW())
             AND public.is_verified_company_user(j.company_user_id)
           )
         )
    )
  );
CREATE POLICY job_skills_insert_own ON public.job_skills
  FOR INSERT WITH CHECK (public.company_owns_job(job_id));
CREATE POLICY job_skills_delete_own ON public.job_skills
  FOR DELETE USING (public.company_owns_job(job_id));

CREATE POLICY job_applications_admin_all ON public.job_applications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_applications_select_visible ON public.job_applications
  FOR SELECT USING (
    applicant_id = public.auth_user_id()
    OR public.company_owns_job(job_id)
  );
CREATE POLICY job_applications_insert_own ON public.job_applications
  FOR INSERT WITH CHECK (applicant_id = public.auth_user_id() AND public.is_member());
CREATE POLICY job_applications_update_company ON public.job_applications
  FOR UPDATE USING (public.company_owns_job(job_id))
  WITH CHECK (public.company_owns_job(job_id));
CREATE POLICY job_applications_withdraw_own ON public.job_applications
  FOR UPDATE USING (applicant_id = public.auth_user_id() AND public.is_member())
  WITH CHECK (applicant_id = public.auth_user_id() AND public.is_member() AND status = 'withdrawn');

CREATE POLICY application_status_history_admin_all ON public.application_status_history
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY application_status_history_select_visible ON public.application_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND (ja.applicant_id = public.auth_user_id()
              OR public.company_owns_job(ja.job_id))
    )
  );
CREATE POLICY application_status_history_insert_company ON public.application_status_history
  FOR INSERT WITH CHECK (public.company_owns_application(application_id));

CREATE POLICY interview_schedules_admin_all ON public.interview_schedules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY interview_schedules_select_visible ON public.interview_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND (ja.applicant_id = public.auth_user_id()
              OR public.company_owns_job(ja.job_id))
    )
  );
CREATE POLICY interview_schedules_insert_company ON public.interview_schedules
  FOR INSERT WITH CHECK (public.company_owns_application(application_id));
CREATE POLICY interview_schedules_update_company ON public.interview_schedules
  FOR UPDATE USING (public.company_owns_application(application_id))
  WITH CHECK (public.company_owns_application(application_id));
CREATE POLICY interview_schedules_update_applicant_response ON public.interview_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND ja.applicant_id = public.auth_user_id()
         AND public.is_member()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = application_id
         AND ja.applicant_id = public.auth_user_id()
         AND public.is_member()
    )
  );

CREATE POLICY saved_jobs_admin_all ON public.saved_jobs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY saved_jobs_select_own ON public.saved_jobs
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY saved_jobs_insert_own ON public.saved_jobs
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY saved_jobs_delete_own ON public.saved_jobs
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY job_alerts_admin_all ON public.job_alerts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_alerts_select_own ON public.job_alerts
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY job_alerts_insert_own ON public.job_alerts
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY job_alerts_update_own ON public.job_alerts
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_member())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_member());
CREATE POLICY job_alerts_delete_own ON public.job_alerts
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_member());

CREATE POLICY job_view_logs_admin_all ON public.job_view_logs
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_view_logs_insert_viewer ON public.job_view_logs
  FOR INSERT WITH CHECK (
    viewer_user_id IS NULL
    OR (viewer_user_id = public.auth_user_id() AND public.is_active_user())
  );
CREATE POLICY job_view_logs_select_company ON public.job_view_logs
  FOR SELECT USING (public.company_owns_job(job_id));

CREATE POLICY conversations_admin_all ON public.conversations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY conversations_select_participant ON public.conversations
  FOR SELECT USING (public.is_my_conversation(id));
CREATE POLICY conversations_insert_authenticated ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (public.is_active_user());
CREATE POLICY conversations_update_participant ON public.conversations
  FOR UPDATE USING (public.is_my_conversation(id) AND public.is_active_user())
  WITH CHECK (public.is_my_conversation(id) AND public.is_active_user());

CREATE POLICY conversation_participants_admin_all ON public.conversation_participants
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY conversation_participants_select ON public.conversation_participants
  FOR SELECT USING (public.is_my_conversation(conversation_id));
CREATE POLICY conversation_participants_insert_own ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY conversation_participants_update_own ON public.conversation_participants
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY messages_admin_all ON public.messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY messages_select_participant ON public.messages
  FOR SELECT USING (sender_id = public.auth_user_id() OR receiver_id = public.auth_user_id() OR public.is_my_conversation(conversation_id));
CREATE POLICY messages_insert_own ON public.messages
  FOR INSERT WITH CHECK (sender_id = public.auth_user_id() AND public.is_active_user() AND public.is_my_conversation(conversation_id));
CREATE POLICY messages_update_own ON public.messages
  FOR UPDATE USING (sender_id = public.auth_user_id() AND deleted_at IS NULL AND public.is_active_user())
  WITH CHECK (sender_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY messages_update_read ON public.messages
  FOR UPDATE USING (public.is_my_conversation(conversation_id) AND public.is_active_user())
  WITH CHECK (public.is_my_conversation(conversation_id) AND public.is_active_user());

CREATE POLICY user_blocks_admin_all ON public.user_blocks
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY user_blocks_select_own ON public.user_blocks
  FOR SELECT USING (blocker_id = public.auth_user_id());
CREATE POLICY user_blocks_insert_own ON public.user_blocks
  FOR INSERT WITH CHECK (blocker_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY user_blocks_delete_own ON public.user_blocks
  FOR DELETE USING (blocker_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY notifications_admin_all ON public.notifications
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY notification_preferences_admin_all ON public.notification_preferences
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY notification_preferences_select_own ON public.notification_preferences
  FOR SELECT USING (user_id = public.auth_user_id());
CREATE POLICY notification_preferences_insert_own ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY notification_preferences_update_own ON public.notification_preferences
  FOR UPDATE USING (user_id = public.auth_user_id() AND public.is_active_user())
  WITH CHECK (user_id = public.auth_user_id() AND public.is_active_user());
CREATE POLICY notification_preferences_delete_own ON public.notification_preferences
  FOR DELETE USING (user_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY report_types_select_active ON public.report_types
  FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY report_types_admin_all ON public.report_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY reports_admin_all ON public.reports
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY reports_select_own ON public.reports
  FOR SELECT USING (reporter_id = public.auth_user_id());
CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT WITH CHECK (reporter_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY moderation_actions_admin_all ON public.moderation_actions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY appeals_admin_all ON public.appeals
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY appeals_select_own ON public.appeals
  FOR SELECT USING (appellant_id = public.auth_user_id());
CREATE POLICY appeals_insert_own ON public.appeals
  FOR INSERT WITH CHECK (appellant_id = public.auth_user_id() AND public.is_active_user());

CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY audit_logs_admin_insert ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY audit_logs_authenticated_insert ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND actor_id = (
      SELECT id FROM public.users
      WHERE auth_id = auth.uid()
      AND deleted_at IS NULL
    )
  );

CREATE POLICY system_settings_admin_all ON public.system_settings
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY network_suggestions_admin_all ON public.network_suggestions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY network_suggestions_select_own ON public.network_suggestions
  FOR SELECT USING (user_id = public.auth_user_id());

CREATE POLICY user_feeds_admin_all ON public.user_feeds
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY user_feeds_select_own ON public.user_feeds
  FOR SELECT USING (user_id = public.auth_user_id());

CREATE POLICY provinces_select_all ON public.provinces FOR SELECT USING (TRUE);
CREATE POLICY provinces_admin_all ON public.provinces
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY wards_select_all ON public.wards FOR SELECT USING (TRUE);
CREATE POLICY wards_admin_all ON public.wards
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_types_select_all ON public.job_types FOR SELECT USING (TRUE);
CREATE POLICY job_types_admin_all ON public.job_types
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY work_modes_select_all ON public.work_modes FOR SELECT USING (TRUE);
CREATE POLICY work_modes_admin_all ON public.work_modes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY job_positions_select_all ON public.job_positions FOR SELECT USING (TRUE);
CREATE POLICY job_positions_admin_all ON public.job_positions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- 18. REALTIME PUBLICATIONS
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;
END
$$;

ALTER TABLE public.notifications      REPLICA IDENTITY DEFAULT;
ALTER TABLE public.connections        REPLICA IDENTITY DEFAULT;
ALTER TABLE public.profile_view_logs  REPLICA IDENTITY DEFAULT;
ALTER TABLE public.posts              REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_reactions     REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_comments      REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_shares        REPLICA IDENTITY DEFAULT;
ALTER TABLE public.poll_options       REPLICA IDENTITY DEFAULT;
ALTER TABLE public.poll_votes         REPLICA IDENTITY DEFAULT;
ALTER TABLE public.messages           REPLICA IDENTITY DEFAULT;
ALTER TABLE public.conversations      REPLICA IDENTITY DEFAULT;
ALTER TABLE public.conversation_participants REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'connections') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.connections';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profile_view_logs') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_view_logs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.posts';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_reactions') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_comments') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'post_shares') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_shares';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'poll_options') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'poll_votes') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_participants') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants';
  END IF;
END
$$;

-- =============================================================================
-- 19. STORAGE BUCKETS
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads', 'uploads', TRUE, 52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs', 'cvs', FALSE, 5242880,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "everyone can view" ON storage.objects;
DROP POLICY IF EXISTS "owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: public read" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;
DROP POLICY IF EXISTS "cvs: authenticated insert own folder" ON storage.objects;
DROP POLICY IF EXISTS "cvs: owner select" ON storage.objects;
DROP POLICY IF EXISTS "cvs: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] IN ('post-media', 'member-avatar', 'member-cover')
    AND (storage.foldername(name))[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "uploads: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'uploads');

CREATE POLICY "uploads: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] IN ('post-media', 'member-avatar', 'member-cover')
    AND (storage.foldername(name))[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cvs: authenticated insert own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cvs: owner select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "cvs: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cvs'
    AND (storage.foldername(name))[1] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- =============================================================================
-- 20. SEED DATA
-- =============================================================================

INSERT INTO report_types (code, name, name_en, sort_order) VALUES
    ('spam',             'Spam / Quảng cáo',              'Spam / Advertising',              1),
    ('harassment',       'Quấy rối / Bắt nạt',            'Harassment / Bullying',           2),
    ('misinformation',   'Tin giả / Sai sự thật',          'Misinformation / False news',      3),
    ('inappropriate',    'Nội dung không phù hợp',         'Inappropriate content',            4),
    ('violence',         'Bạo lực / Nguy hiểm',           'Violence / Dangerous content',      5),
    ('hate_speech',      'Ngôn từ thù địch',              'Hate speech',                      6),
    ('impersonation',    'Giả mạo danh tính',             'Impersonation',                    7),
    ('copyright',        'Vi phạm bản quyền',              'Copyright violation',              8),
    ('fraud',            'Lừa đảo',                       'Fraud / Scam',                     9),
    ('other',            'Khác',                          'Other',                            10)
ON CONFLICT (code) DO NOTHING;

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('site_name',           'site_identity', '"Joblink"'::jsonb,                                          FALSE),
    ('site_description',    'site_identity', '"Mạng xã hội việc làm và tuyển dụng "'::jsonb, FALSE),
    ('site_logo_url',       'site_identity', 'null'::jsonb,                                               FALSE),
    ('site_favicon_url',    'site_identity', 'null'::jsonb,                                               FALSE),
    ('default_locale',      'regional',      '"vi"'::jsonb,                                               FALSE),
    ('default_timezone',    'regional',      '"Asia/Ho_Chi_Minh"'::jsonb,                                 FALSE),
    ('default_currency',    'regional',      '"VND"'::jsonb,                                              FALSE),
    ('available_locales',   'regional',      '["vi","en"]'::jsonb,                                        FALSE),
    ('smtp_host',           'smtp',          'null'::jsonb,                                               TRUE),
    ('smtp_port',           'smtp',          '587'::jsonb,                                                FALSE),
    ('smtp_username',       'smtp',          'null'::jsonb,                                               TRUE),
    ('smtp_password',       'smtp',          'null'::jsonb,                                               TRUE),
    ('smtp_encryption',     'smtp',          '"tls"'::jsonb,                                              FALSE),
    ('smtp_from_email',     'smtp',          'null'::jsonb,                                               FALSE),
    ('smtp_from_name',      'smtp',          '"Joblink"'::jsonb,                                          FALSE),
    ('recaptcha_enabled',   'recaptcha',     'false'::jsonb,                                              FALSE),
    ('recaptcha_site_key',  'recaptcha',     'null'::jsonb,                                               FALSE),
    ('recaptcha_secret',    'recaptcha',     'null'::jsonb,                                               TRUE),
    ('login_rate_limit',    'security',      '10'::jsonb,                                                 FALSE),
    ('upload_max_mb',       'security',      '10'::jsonb,                                                 FALSE),
    ('require_2fa_admin',   'security',      'true'::jsonb,                                               FALSE),
    ('google_auth_enabled',       'security',     'false'::jsonb, FALSE),
    ('require_email_verification', 'security', 'false'::jsonb, FALSE),
    ('passkey_enabled',           'security',     'false'::jsonb, FALSE),
    ('contact_address',     'contact',     'null'::jsonb,  FALSE),
    ('contact_email',       'contact',     'null'::jsonb,  FALSE),
    ('contact_phone',       'contact',     'null'::jsonb,  FALSE),
    ('contact_content',     'contact',     'null'::jsonb,  FALSE),
    ('contact_map_url',     'contact',     'null'::jsonb,  FALSE),
    ('maintenance_mode',    'maintenance', 'false'::jsonb, FALSE),
    ('maintenance_message', 'maintenance',
        '"Hệ thống đang được bảo trì. Vui lòng quay lại sau ít phút."'::jsonb, FALSE)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO job_types (code, name, name_en, sort_order, is_system) VALUES
    ('fulltime',   'Toàn thời gian',  'Full-time',  1, TRUE),
    ('parttime',   'Bán thời gian',   'Part-time',  2, TRUE),
    ('internship', 'Thực tập',        'Internship', 3, TRUE),
    ('contract',   'Hợp đồng',        'Contract',   4, TRUE),
    ('freelance',  'Tự do',           'Freelance',  5, TRUE);

INSERT INTO work_modes (code, name, name_en, sort_order, is_system) VALUES
    ('onsite', 'Tại văn phòng', 'On-site', 1, TRUE),
    ('remote', 'Từ xa',         'Remote',  2, TRUE),
    ('hybrid',  'Kết hợp',      'Hybrid',  3, TRUE);

INSERT INTO job_positions (code, name, name_en, sort_order) VALUES
    ('intern-dev',       'Thực tập sinh Lập trình',     'Intern Developer',      10),
    ('fresher-dev',      'Lập trình viên Fresher',      'Fresher Developer',     20),
    ('backend-dev',      'Lập trình viên Backend',      'Backend Developer',     30),
    ('frontend-dev',     'Lập trình viên Frontend',     'Frontend Developer',    40),
    ('fullstack-dev',    'Lập trình viên Fullstack',    'Fullstack Developer',   50),
    ('mobile-dev',       'Lập trình viên Mobile',       'Mobile Developer',      60),
    ('ba',               'Business Analyst',            'Business Analyst',      70),
    ('qa-tester',        'Kiểm thử phần mềm',           'QA / Tester',           80),
    ('devops',           'DevOps Engineer',             'DevOps Engineer',       90),
    ('data-engineer',    'Kỹ sư dữ liệu',               'Data Engineer',        100),
    ('data-scientist',   'Nhà khoa học dữ liệu',        'Data Scientist',       110),
    ('ui-ux-designer',   'Thiết kế UI/UX',              'UI/UX Designer',       120),
    ('project-manager',  'Quản lý dự án',               'Project Manager',      130),
    ('product-manager',  'Quản lý sản phẩm',            'Product Manager',      140),
    ('hr',               'Nhân sự',                     'Human Resources',      150),
    ('marketing',        'Marketing',                   'Marketing',            160),
    ('sales',            'Kinh doanh',                  'Sales',                170);

INSERT INTO provinces (code, name, sort_order) VALUES
    ('01', 'Hà Nội', 10),
    ('02', 'Hưng Yên', 20),
    ('03', 'Quảng Trị', 30),
    ('04', 'Huế', 40),
    ('05', 'Hải Phòng', 50),
    ('06', 'Phú Thọ', 60),
    ('07', 'Thanh Hoá', 70),
    ('08', 'Quảng Ninh', 80),
    ('09', 'Lào Cai', 90),
    ('10', 'Bắc Ninh', 100),
    ('11', 'Nghệ An', 110),
    ('12', 'Đà Nẵng', 120),
    ('13', 'Ninh Bình', 130),
    ('14', 'Khánh Hòa', 140),
    ('15', 'Tây Ninh', 150),
    ('16', 'Đồng Tháp', 160),
    ('17', 'Hà Tĩnh', 170),
    ('18', 'An Giang', 180),
    ('19', 'Thái Nguyên', 190),
    ('20', 'Lạng Sơn', 200),
    ('21', 'Điện Biên', 210),
    ('22', 'Đồng Nai', 220),
    ('23', 'Quảng Ngãi', 230),
    ('24', 'Vĩnh Long', 240),
    ('25', 'Cao Bằng', 250),
    ('26', 'Lai Châu', 260),
    ('27', 'Đắk Lắk', 270),
    ('28', 'Gia Lai', 280),
    ('29', 'Lâm Đồng', 290),
    ('30', 'Hồ Chí Minh', 300),
    ('31', 'Sơn La', 310),
    ('32', 'Cần Thơ', 320),
    ('33', 'Cà Mau', 330),
    ('34', 'Tuyên Quang', 340);

INSERT INTO wards (province_id, code, name)
SELECT p.id, w.code, w.name
FROM (VALUES
    ('18', '00001', 'Phường Rạch Giá'),
    ('30', '00002', 'Phường Dĩ An'),
    ('30', '00003', 'Phường Hiệp Bình'),
    ('30', '00004', 'Phường Tăng Nhơn Phú'),
    ('30', '00005', 'Xã Bà Điểm'),
    ('12', '00006', 'Phường Thanh Khê'),
    ('07', '00007', 'Phường Hạc Thành'),
    ('22', '00008', 'Phường Trấn Biên'),
    ('30', '00009', 'Phường Chánh Hưng'),
    ('30', '00010', 'Xã Đông Thạnh'),
    ('13', '00011', 'Phường Nam Định'),
    ('30', '00012', 'Phường Bình Hưng Hòa'),
    ('01', '00013', 'Phường Hà Đông'),
    ('30', '00014', 'Xã Bình Hưng'),
    ('30', '00015', 'Phường Đông Hưng Thuận'),
    ('30', '00016', 'Phường An Phú Đông'),
    ('30', '00017', 'Phường An Lạc'),
    ('27', '00018', 'Phường Buôn Ma Thuột'),
    ('22', '00019', 'Phường Long Bình'),
    ('30', '00020', 'Phường Tân Thới Hiệp'),
    ('30', '00021', 'Xã Vĩnh Lộc'),
    ('30', '00022', 'Phường Bình Trị Đông'),
    ('30', '00023', 'Xã Tân Vĩnh Lộc'),
    ('30', '00024', 'Phường An Phú'),
    ('30', '00025', 'Phường Bình Tân'),
    ('05', '00026', 'Phường Lê Chân'),
    ('30', '00027', 'Phường Linh Xuân'),
    ('18', '00028', 'Đặc khu Phú Quốc'),
    ('30', '00029', 'Phường Bình Đông'),
    ('18', '00030', 'Phường Long Xuyên'),
    ('30', '00031', 'Phường Tân Hưng'),
    ('30', '00032', 'Phường Tam Bình'),
    ('30', '00033', 'Phường Thạnh Mỹ Tây'),
    ('30', '00034', 'Phường Thuận Giao'),
    ('30', '00035', 'Phường Phú Định'),
    ('13', '00036', 'Phường Hoa Lư'),
    ('30', '00037', 'Phường Tân Thuận'),
    ('30', '00038', 'Phường Tân Hiệp'),
    ('11', '00039', 'Phường Trường Vinh'),
    ('30', '00040', 'Phường Phú Thọ Hòa'),
    ('22', '00041', 'Phường Tam Hiệp'),
    ('16', '00042', 'Phường Cao Lãnh'),
    ('30', '00043', 'Phường Phước Long'),
    ('01', '00044', 'Phường Tương Mai'),
    ('14', '00045', 'Phường Nha Trang'),
    ('30', '00046', 'Phường Bảy Hiền'),
    ('30', '00047', 'Phường Đông Hòa'),
    ('12', '00048', 'Phường Hải Châu'),
    ('04', '00049', 'Phường Phú Xuân'),
    ('14', '00050', 'Phường Nam Nha Trang'),
    ('01', '00051', 'Phường Bạch Mai'),
    ('28', '00052', 'Phường Quy Nhơn'),
    ('30', '00053', 'Phường Hạnh Thông'),
    ('30', '00054', 'Xã Củ Chi'),
    ('14', '00055', 'Phường Bắc Nha Trang'),
    ('30', '00056', 'Phường Trung Mỹ Tây'),
    ('30', '00057', 'Phường Tân Khánh'),
    ('30', '00058', 'Phường Bình Thạnh'),
    ('27', '00059', 'Phường Tuy Hòa'),
    ('30', '00060', 'Phường Gia Định'),
    ('30', '00061', 'Xã Nhà Bè'),
    ('30', '00062', 'Phường Thới An'),
    ('01', '00063', 'Phường Nghĩa Đô'),
    ('30', '00064', 'Phường An Hội Đông'),
    ('11', '00065', 'Phường Thành Vinh'),
    ('01', '00066', 'Phường Hồng Hà'),
    ('10', '00067', 'Phường Bắc Giang'),
    ('30', '00068', 'Phường Bình Trưng'),
    ('30', '00069', 'Phường Thông Tây Hội'),
    ('30', '00070', 'Phường An Hội Tây'),
    ('30', '00071', 'Phường Bình Hòa'),
    ('01', '00072', 'Phường Bồ Đề'),
    ('01', '00073', 'Phường Từ Liêm'),
    ('30', '00074', 'Phường Long Bình'),
    ('32', '00075', 'Phường Ninh Kiều'),
    ('12', '00076', 'Phường Hòa Cường'),
    ('30', '00077', 'Phường Thủ Đức'),
    ('30', '00078', 'Phường Lái Thiêu'),
    ('01', '00079', 'Xã Đông Anh'),
    ('01', '00080', 'Xã Sóc Sơn'),
    ('30', '00081', 'Phường Vũng Tàu'),
    ('30', '00082', 'Phường Tân Sơn Nhì'),
    ('30', '00083', 'Phường Bình Lợi Trung'),
    ('05', '00084', 'Phường An Biên'),
    ('12', '00085', 'Phường Ngũ Hành Sơn'),
    ('30', '00086', 'Xã Tân Nhựt'),
    ('30', '00087', 'Phường An Nhơn'),
    ('30', '00088', 'Phường Tân Tạo'),
    ('05', '00089', 'Phường Hồng Bàng'),
    ('12', '00090', 'Phường Hòa Khánh'),
    ('01', '00091', 'Xã Phù Đổng'),
    ('19', '00092', 'Phường Phan Đình Phùng'),
    ('22', '00093', 'Phường Bình Phước'),
    ('30', '00094', 'Phường Gò Vấp'),
    ('30', '00095', 'Xã Long Hải'),
    ('01', '00096', 'Phường Kim Liên'),
    ('14', '00097', 'Phường Tây Nha Trang'),
    ('30', '00098', 'Phường Phú Lợi'),
    ('30', '00099', 'Phường Bình Dương'),
    ('15', '00100', 'Phường Long An'),
    ('01', '00101', 'Phường Thanh Xuân'),
    ('15', '00102', 'Phường Long Hoa'),
    ('01', '00103', 'Phường Văn Miếu - Quốc Tử Giám'),
    ('01', '00104', 'Phường Hoàn Kiếm'),
    ('22', '00105', 'Phường Trảng Dài'),
    ('01', '00106', 'Phường Xuân Phương'),
    ('16', '00107', 'Phường Sa Đéc'),
    ('22', '00108', 'Xã Xuân Lộc'),
    ('30', '00109', 'Phường Vườn Lài'),
    ('30', '00110', 'Phường Phú Thạnh'),
    ('30', '00111', 'Xã Xuân Thới Sơn'),
    ('29', '00112', 'Phường Xuân Hương - Đà Lạt'),
    ('05', '00113', 'Phường Hải An'),
    ('01', '00114', 'Xã Thư Lâm'),
    ('05', '00115', 'Phường Gia Viên'),
    ('01', '00116', 'Xã An Khánh'),
    ('22', '00117', 'Phường Tân Triều'),
    ('30', '00118', 'Phường Tân Đông Hiệp'),
    ('01', '00119', 'Phường Tây Hồ'),
    ('01', '00120', 'Xã Tây Phương'),
    ('07', '00121', 'Phường Sầm Sơn'),
    ('30', '00122', 'Xã Bình Mỹ'),
    ('04', '00123', 'Phường Thuận Hóa'),
    ('01', '00124', 'Phường Hoàng Mai'),
    ('30', '00125', 'Phường Bến Cát'),
    ('30', '00126', 'Xã Phú Hòa Đông'),
    ('01', '00127', 'Xã Ô Diên'),
    ('18', '00128', 'Phường Châu Đốc'),
    ('01', '00129', 'Phường Giảng Võ'),
    ('01', '00130', 'Xã Phú Xuyên'),
    ('30', '00131', 'Phường Hòa Hưng'),
    ('01', '00132', 'Xã Phúc Thịnh'),
    ('32', '00133', 'Phường Phú Lợi'),
    ('30', '00134', 'Phường Khánh Hội'),
    ('12', '00135', 'Phường An Khê'),
    ('01', '00136', 'Phường Ngọc Hà'),
    ('30', '00137', 'Phường Tân Hòa'),
    ('30', '00138', 'Xã Hóc Môn'),
    ('30', '00139', 'Phường Tân Phú'),
    ('22', '00140', 'Xã Long Thành'),
    ('22', '00141', 'Xã Trảng Bom'),
    ('01', '00142', 'Xã Đại Thanh'),
    ('02', '00143', 'Phường Trần Lãm'),
    ('30', '00144', 'Phường Bình Tiên'),
    ('17', '00145', 'Phường Thành Sen'),
    ('30', '00146', 'Phường Minh Phụng'),
    ('01', '00147', 'Phường Vĩnh Tuy'),
    ('01', '00148', 'Xã Gia Lâm'),
    ('10', '00149', 'Xã Hiệp Hoà'),
    ('30', '00150', 'Phường Tân Bình'),
    ('15', '00151', 'Phường Tân Ninh'),
    ('23', '00152', 'Xã Bình Sơn'),
    ('18', '00153', 'Xã Nhơn Mỹ'),
    ('05', '00154', 'Phường Ngô Quyền'),
    ('30', '00155', 'Phường Thủ Dầu Một'),
    ('30', '00156', 'Phường Nhiêu Lộc'),
    ('27', '00157', 'Xã Ea Kar'),
    ('01', '00158', 'Phường Chương Mỹ'),
    ('01', '00159', 'Phường Hai Bà Trưng'),
    ('30', '00160', 'Phường Phú Lâm'),
    ('12', '00161', 'Phường Sơn Trà'),
    ('29', '00162', 'Xã Phan Rí Cửa'),
    ('14', '00163', 'Xã Cam Lâm'),
    ('30', '00164', 'Phường Tam Thắng'),
    ('01', '00165', 'Phường Khương Đình'),
    ('32', '00166', 'Phường Tân An'),
    ('12', '00167', 'Phường Hòa Xuân'),
    ('22', '00168', 'Xã Định Quán'),
    ('01', '00169', 'Phường Định Công'),
    ('29', '00170', 'Phường Phan Thiết'),
    ('29', '00171', 'Xã Đức Trọng'),
    ('30', '00172', 'Phường Chợ Lớn'),
    ('30', '00173', 'Phường Tân Sơn Nhất'),
    ('30', '00174', 'Xã Tân An Hội'),
    ('10', '00175', 'Phường Kinh Bắc'),
    ('10', '00176', 'Xã Đại Đồng'),
    ('03', '00177', 'Phường Đồng Hới'),
    ('30', '00178', 'Phường Phú Thuận'),
    ('33', '00179', 'Phường Tân Thành'),
    ('01', '00180', 'Xã Đa Phúc'),
    ('01', '00181', 'Phường Đông Ngạc'),
    ('22', '00182', 'Xã Bình Minh'),
    ('01', '00183', 'Phường Việt Hưng'),
    ('12', '00184', 'Phường An Hải'),
    ('01', '00185', 'Phường Phương Liệt'),
    ('05', '00186', 'Phường Lê Thanh Nghị'),
    ('01', '00187', 'Phường Đống Đa'),
    ('33', '00188', 'Phường An Xuyên'),
    ('30', '00189', 'Phường An Đông'),
    ('18', '00190', 'Xã Chợ Mới'),
    ('16', '00191', 'Xã Lai Vung'),
    ('01', '00192', 'Phường Đại Mỗ'),
    ('01', '00193', 'Xã Bình Minh'),
    ('30', '00194', 'Phường Hòa Lợi'),
    ('30', '00195', 'Phường Thới Hòa'),
    ('28', '00196', 'Phường Pleiku'),
    ('22', '00197', 'Xã Gia Kiệm'),
    ('22', '00198', 'Phường Hố Nai'),
    ('12', '00199', 'Phường Cẩm Lệ'),
    ('30', '00200', 'Phường Cầu Ông Lãnh'),
    ('30', '00201', 'Phường Phú Mỹ'),
    ('06', '00202', 'Phường Hoà Bình'),
    ('22', '00203', 'Xã Nhơn Trạch'),
    ('22', '00204', 'Xã Xuân Hòa'),
    ('06', '00205', 'Phường Vĩnh Phúc'),
    ('15', '00206', 'Xã Cần Giuộc'),
    ('02', '00207', 'Xã Như Quỳnh'),
    ('07', '00208', 'Phường Quảng Phú'),
    ('23', '00209', 'Phường Kon Tum'),
    ('28', '00210', 'Xã Tuy Phước'),
    ('30', '00211', 'Phường Tân Sơn'),
    ('05', '00212', 'Phường An Hải'),
    ('22', '00213', 'Phường Long Khánh'),
    ('01', '00214', 'Phường Yên Hòa'),
    ('09', '00215', 'Phường Lào Cai'),
    ('30', '00216', 'Phường An Khánh'),
    ('05', '00217', 'Phường An Dương'),
    ('22', '00218', 'Xã Tân Phú'),
    ('16', '00219', 'Xã Tân Long'),
    ('30', '00220', 'Phường Bình Thới'),
    ('30', '00221', 'Phường Rạch Dừa'),
    ('01', '00222', 'Phường Thanh Liệt'),
    ('30', '00223', 'Xã Bình Chánh'),
    ('16', '00224', 'Xã Tân Phước 3'),
    ('30', '00225', 'Phường Bình Phú'),
    ('02', '00226', 'Xã Yên Mỹ'),
    ('30', '00227', 'Phường Diên Hồng'),
    ('01', '00228', 'Xã Phúc Thọ'),
    ('22', '00229', 'Phường Biên Hòa'),
    ('01', '00230', 'Xã Đại Xuyên'),
    ('01', '00231', 'Phường Phú Diễn'),
    ('01', '00232', 'Xã Thiên Lộc'),
    ('01', '00233', 'Phường Cầu Giấy'),
    ('11', '00234', 'Phường Vinh Phú'),
    ('22', '00235', 'Phường Long Hưng'),
    ('18', '00236', 'Xã Hội An'),
    ('16', '00237', 'Xã Lấp Vò'),
    ('10', '00238', 'Xã Xuân Cẩm'),
    ('30', '00239', 'Phường Long Trường'),
    ('11', '00240', 'Xã Quỳnh Lưu'),
    ('23', '00241', 'Phường Nghĩa Lộ'),
    ('32', '00242', 'Phường Ô Môn'),
    ('16', '00243', 'Phường Đạo Thạnh'),
    ('27', '00244', 'Phường Tân Lập'),
    ('28', '00245', 'Phường Quy Nhơn Nam'),
    ('30', '00246', 'Phường Tân Uyên'),
    ('06', '00247', 'Phường Việt Trì'),
    ('18', '00248', 'Phường Bình Đức'),
    ('30', '00249', 'Phường Tây Thạnh'),
    ('12', '00250', 'Phường Điện Bàn Đông'),
    ('14', '00251', 'Phường Phan Rang'),
    ('01', '00252', 'Xã Hát Môn'),
    ('11', '00253', 'Xã Quỳnh Phú'),
    ('08', '00254', 'Phường Mạo Khê'),
    ('34', '00255', 'Phường Minh Xuân'),
    ('22', '00256', 'Xã Dầu Giây'),
    ('30', '00257', 'Phường Bến Thành'),
    ('05', '00258', 'Phường Thuỷ Nguyên'),
    ('10', '00259', 'Xã Hợp Thịnh'),
    ('22', '00260', 'Xã Thống Nhất'),
    ('13', '00261', 'Xã Xuân Trường'),
    ('16', '00262', 'Xã Phong Hòa'),
    ('30', '00263', 'Xã Hưng Long'),
    ('30', '00264', 'Phường Đức Nhuận'),
    ('23', '00265', 'Xã An Phú'),
    ('29', '00266', 'Phường Lâm Viên - Đà Lạt'),
    ('01', '00267', 'Xã Yên Lãng'),
    ('01', '00268', 'Phường Sơn Tây'),
    ('01', '00269', 'Phường Ô Chợ Dừa'),
    ('18', '00270', 'Xã Phú Tân'),
    ('05', '00271', 'Đặc khu Cát Hải'),
    ('32', '00272', 'Phường Cái Răng'),
    ('01', '00273', 'Xã Phú Nghĩa'),
    ('01', '00274', 'Phường Kiến Hưng'),
    ('01', '00275', 'Xã Thường Tín'),
    ('29', '00276', 'Xã Liên Hương'),
    ('01', '00277', 'Xã Cổ Đô'),
    ('12', '00278', 'Phường Liên Chiểu'),
    ('07', '00279', 'Xã Vạn Lộc'),
    ('16', '00280', 'Phường Trung An'),
    ('01', '00281', 'Xã Nội Bài'),
    ('09', '00282', 'Phường Yên Bái'),
    ('18', '00283', 'Xã Giồng Riềng'),
    ('18', '00284', 'Xã Cù Lao Giêng'),
    ('14', '00285', 'Xã Ninh Phước'),
    ('18', '00286', 'Xã Châu Thành'),
    ('13', '00287', 'Phường Trường Thi'),
    ('01', '00288', 'Xã Quang Minh'),
    ('01', '00289', 'Xã Hòa Xá'),
    ('12', '00290', 'Xã Núi Thành'),
    ('30', '00291', 'Phường Hoà Bình'),
    ('01', '00292', 'Xã Hoài Đức'),
    ('02', '00293', 'Phường Phố Hiến'),
    ('28', '00294', 'Xã Chư Sê'),
    ('16', '00295', 'Xã Hòa Long'),
    ('27', '00296', 'Xã Krông Pắc'),
    ('30', '00297', 'Phường Cát Lái'),
    ('18', '00298', 'Xã Bình Mỹ'),
    ('16', '00299', 'Xã Phú Hựu'),
    ('32', '00300', 'Phường Vĩnh Châu'),
    ('30', '00301', 'Phường Phú Nhuận'),
    ('01', '00302', 'Xã Thuận An'),
    ('30', '00303', 'Phường Tân Mỹ'),
    ('11', '00304', 'Phường Vinh Lộc'),
    ('02', '00305', 'Phường Thái Bình'),
    ('09', '00306', 'Phường Cam Đường'),
    ('30', '00307', 'Xã Hiệp Phước'),
    ('30', '00308', 'Phường Bàn Cờ'),
    ('01', '00309', 'Phường Vĩnh Hưng'),
    ('01', '00310', 'Xã Xuân Mai'),
    ('10', '00311', 'Phường Võ Cường'),
    ('05', '00312', 'Phường Kiến An'),
    ('16', '00313', 'Xã Tân Hương'),
    ('01', '00314', 'Phường Phúc Lợi'),
    ('16', '00315', 'Phường Mỹ Tho'),
    ('18', '00316', 'Xã Tân Hiệp'),
    ('08', '00317', 'Phường Cửa Ông'),
    ('15', '00318', 'Phường Gò Dầu'),
    ('33', '00319', 'Xã Lương Thế Trân'),
    ('10', '00320', 'Phường Từ Sơn'),
    ('18', '00321', 'Xã An Châu'),
    ('18', '00322', 'Xã Long Điền'),
    ('30', '00323', 'Phường Phú Thọ'),
    ('01', '00324', 'Phường Ba Đình'),
    ('13', '00325', 'Xã Hải Hưng'),
    ('18', '00326', 'Xã Thạnh Mỹ Tây'),
    ('05', '00327', 'Phường Hồng An'),
    ('11', '00328', 'Phường Cửa Lò'),
    ('01', '00329', 'Xã Vĩnh Thanh'),
    ('30', '00330', 'Phường Thuận An'),
    ('18', '00331', 'Xã Vĩnh Thạnh Trung'),
    ('30', '00332', 'Phường Bình Cơ'),
    ('01', '00333', 'Xã Tiến Thắng'),
    ('22', '00334', 'Phường Phước Tân'),
    ('29', '00335', 'Xã Di Linh'),
    ('30', '00336', 'Phường Tân Sơn Hòa'),
    ('27', '00337', 'Phường Tân An'),
    ('06', '00338', 'Phường Phúc Yên'),
    ('01', '00339', 'Xã Ứng Hòa'),
    ('30', '00340', 'Phường Chợ Quán'),
    ('10', '00341', 'Xã Yên Phong'),
    ('10', '00342', 'Xã Lạng Giang'),
    ('28', '00343', 'Phường Diên Hồng'),
    ('01', '00344', 'Xã Quốc Oai'),
    ('11', '00345', 'Xã Diễn Châu'),
    ('30', '00346', 'Phường Bình Tây'),
    ('01', '00347', 'Xã Sơn Đồng'),
    ('32', '00348', 'Xã Thạnh Hòa'),
    ('07', '00349', 'Phường Hàm Rồng'),
    ('11', '00350', 'Xã Đại Đồng'),
    ('01', '00351', 'Xã Hồng Sơn'),
    ('30', '00352', 'Phường Vĩnh Hội'),
    ('01', '00353', 'Xã Quảng Bị'),
    ('13', '00354', 'Phường Phủ Lý'),
    ('01', '00355', 'Phường Long Biên'),
    ('16', '00356', 'Xã Tân Phú Trung'),
    ('27', '00357', 'Phường Buôn Hồ'),
    ('01', '00358', 'Xã Dân Hòa'),
    ('30', '00359', 'Phường Cầu Kiệu'),
    ('32', '00360', 'Phường Bình Thủy'),
    ('22', '00361', 'Xã Phú Lâm'),
    ('01', '00362', 'Xã Mê Linh'),
    ('24', '00363', 'Xã Phú Túc'),
    ('11', '00364', 'Xã Đô Lương'),
    ('30', '00365', 'Phường Vĩnh Tân'),
    ('27', '00366', 'Phường Phú Yên'),
    ('19', '00367', 'Phường Vạn Xuân'),
    ('18', '00368', 'Xã Hòn Đất'),
    ('18', '00369', 'Xã Bình Sơn'),
    ('08', '00370', 'Phường Cẩm Phả'),
    ('01', '00371', 'Xã Phúc Lộc'),
    ('32', '00372', 'Phường Thốt Nốt'),
    ('01', '00373', 'Xã Trung Giã'),
    ('32', '00374', 'Phường Sóc Trăng'),
    ('12', '00375', 'Xã Đại Lộc'),
    ('07', '00376', 'Phường Đông Quang'),
    ('15', '00377', 'Phường An Tịnh'),
    ('03', '00378', 'Phường Nam Đông Hà.'),
    ('01', '00379', 'Phường Láng'),
    ('16', '00380', 'Xã Long Phú Thuận'),
    ('27', '00381', 'Xã Quảng Phú'),
    ('23', '00382', 'Phường Cẩm Thành'),
    ('01', '00383', 'Xã Kiều Phú'),
    ('01', '00384', 'Xã Vân Đình'),
    ('18', '00385', 'Xã Mỹ Thuận'),
    ('05', '00386', 'Phường Phù Liễn'),
    ('23', '00387', 'Xã Vạn Tường'),
    ('29', '00388', 'Phường La Gi'),
    ('18', '00389', 'Xã Mỹ Đức'),
    ('18', '00390', 'Phường Mỹ Thới'),
    ('18', '00391', 'Xã Vĩnh Hậu'),
    ('11', '00392', 'Xã Quỳnh Anh'),
    ('01', '00393', 'Xã Phượng Dực'),
    ('11', '00394', 'Phường Vinh Hưng'),
    ('18', '00395', 'Xã Châu Phú'),
    ('01', '00396', 'Xã Chương Dương'),
    ('08', '00397', 'Phường Uông Bí'),
    ('16', '00398', 'Xã Thường Phước'),
    ('22', '00399', 'Xã An Phước'),
    ('16', '00400', 'Xã Cái Bè'),
    ('16', '00401', 'Xã Tân Nhuận Đông'),
    ('18', '00402', 'Xã Thạnh Lộc'),
    ('18', '00403', 'Xã Bình An'),
    ('10', '00404', 'Phường Việt Yên'),
    ('33', '00405', 'Xã Trần Văn Thời'),
    ('10', '00406', 'Xã Tiên Lục'),
    ('23', '00407', 'Xã Tư Nghĩa'),
    ('10', '00408', 'Xã Bảo Đài'),
    ('01', '00409', 'Xã Quảng Oai'),
    ('07', '00410', 'Phường Đông Sơn'),
    ('01', '00411', 'Xã Dương Hòa'),
    ('14', '00412', 'Phường Ninh Hòa'),
    ('01', '00413', 'Xã Hồng Vân'),
    ('32', '00414', 'Phường Ngã Năm'),
    ('07', '00415', 'Phường Tĩnh Gia'),
    ('01', '00416', 'Xã Vật Lại'),
    ('06', '00417', 'Phường Thanh Miếu'),
    ('32', '00418', 'Phường Hưng Phú'),
    ('28', '00419', 'Xã Tuy Phước Đông'),
    ('10', '00420', 'Phường Chũ'),
    ('18', '00421', 'Xã Kiên Lương'),
    ('10', '00422', 'Phường Vân Hà'),
    ('10', '00423', 'Xã Lục Nam'),
    ('11', '00424', 'Phường Quỳnh Mai'),
    ('30', '00425', 'Phường Xóm Chiếu'),
    ('07', '00426', 'Phường Đông Tiến'),
    ('22', '00427', 'Xã Hưng Thịnh'),
    ('06', '00428', 'Phường Nông Trang'),
    ('32', '00429', 'Phường Cái Khế'),
    ('02', '00430', 'Phường Mỹ Hào'),
    ('01', '00431', 'Xã Thạch Thất'),
    ('18', '00432', 'Xã Nhơn Hội'),
    ('18', '00433', 'Xã Long Kiến'),
    ('30', '00434', 'Phường Chánh Hiệp'),
    ('27', '00435', 'Phường Ea Kao'),
    ('16', '00436', 'Xã Châu Thành'),
    ('15', '00437', 'Xã Bến Lức'),
    ('32', '00438', 'Phường Thuận Hưng'),
    ('15', '00439', 'Xã Mỹ Hạnh'),
    ('30', '00440', 'Phường Tây Nam'),
    ('10', '00441', 'Xã Ngọc Thiện'),
    ('18', '00442', 'Xã Định Hòa'),
    ('18', '00443', 'Xã Bình Hòa'),
    ('06', '00444', 'Phường Vĩnh Yên'),
    ('23', '00445', 'Xã Đông Sơn'),
    ('18', '00446', 'Xã Châu Phong'),
    ('05', '00447', 'Phường Chu Văn An'),
    ('32', '00448', 'Xã An Lạc Thôn'),
    ('01', '00449', 'Phường Dương Nội'),
    ('23', '00450', 'Xã Tịnh Khê'),
    ('22', '00451', 'Xã Phước Thái'),
    ('29', '00452', 'Phường 1 Bảo Lộc'),
    ('01', '00453', 'Phường Hoàng Liệt'),
    ('11', '00454', 'Xã Hùng Châu'),
    ('22', '00455', 'Xã Bàu Hàm'),
    ('10', '00456', 'Phường Nếnh'),
    ('11', '00457', 'Xã Kim Liên'),
    ('16', '00458', 'Xã Mỹ An Hưng'),
    ('22', '00459', 'Xã Đại Phước'),
    ('04', '00460', 'Phường An Cựu'),
    ('19', '00461', 'Phường Tích Lương'),
    ('06', '00462', 'Phường Xuân Hòa'),
    ('18', '00463', 'Phường Vĩnh Thông'),
    ('32', '00464', 'Xã Trung Hưng'),
    ('15', '00465', 'Phường Bình Minh'),
    ('02', '00466', 'Xã Hưng Hà'),
    ('04', '00467', 'Phường Thuận An'),
    ('14', '00468', 'Phường Đông Hải'),
    ('16', '00469', 'Xã Mỹ Hiệp'),
    ('29', '00470', 'Phường Hàm Thắng'),
    ('27', '00471', 'Xã Ea Drăng'),
    ('01', '00472', 'Xã Thanh Oai'),
    ('29', '00473', 'Phường 3 Bảo Lộc'),
    ('07', '00474', 'Xã Triệu Sơn'),
    ('12', '00475', 'Xã Thăng Bình'),
    ('33', '00476', 'Xã Cái Nước'),
    ('18', '00477', 'Xã Đông Thái'),
    ('24', '00478', 'Xã Long Hồ'),
    ('27', '00479', 'Xã Ea Ktur'),
    ('27', '00480', 'Xã Phú Hòa 1'),
    ('14', '00481', 'Xã Vạn Ninh'),
    ('01', '00482', 'Xã Phúc Sơn'),
    ('29', '00483', 'Phường Phú Thuỷ'),
    ('01', '00484', 'Xã Ứng Thiên'),
    ('16', '00485', 'Phường Hồng Ngự'),
    ('30', '00486', 'Phường Chánh Phú Hòa'),
    ('08', '00487', 'Đặc khu Vân Đồn'),
    ('18', '00488', 'Xã An Biên'),
    ('18', '00489', 'Xã Thạnh Đông'),
    ('01', '00490', 'Xã Mỹ Đức'),
    ('27', '00491', 'Phường Hòa Hiệp'),
    ('13', '00492', 'Xã Xuân Hưng'),
    ('15', '00493', 'Phường Trảng Bàng'),
    ('13', '00494', 'Phường Nam Hoa Lư'),
    ('12', '00495', 'Xã Nam Phước'),
    ('24', '00496', 'Phường An Hội'),
    ('13', '00497', 'Xã Ý Yên'),
    ('30', '00498', 'Phường Long Nguyên'),
    ('11', '00499', 'Xã Hưng Nguyên'),
    ('30', '00500', 'Phường Long Phước'),
    ('32', '00501', 'Phường Thới Long'),
    ('08', '00502', 'Phường Hạ Long'),
    ('10', '00503', 'Xã Hoàng Vân'),
    ('16', '00504', 'Xã Hội Cư'),
    ('32', '00505', 'Xã Trần Đề'),
    ('01', '00506', 'Phường Cửa Nam'),
    ('08', '00507', 'Phường Quang Hanh'),
    ('01', '00508', 'Xã Hương Sơn'),
    ('18', '00509', 'Xã Tây Yên'),
    ('30', '00510', 'Phường Phước Thắng'),
    ('18', '00511', 'Xã Thoại Sơn'),
    ('27', '00512', 'Phường Thành Nhất'),
    ('31', '00513', 'Xã Mai Sơn'),
    ('10', '00514', 'Phường Thuận Thành'),
    ('30', '00515', 'Phường Bà Rịa'),
    ('15', '00516', 'Phường Ninh Thạnh'),
    ('16', '00517', 'Xã An Hữu'),
    ('24', '00518', 'Xã Ba Tri'),
    ('01', '00519', 'Phường Phú Lương'),
    ('12', '00520', 'Xã Thăng An'),
    ('32', '00521', 'Xã Phong Điền'),
    ('15', '00522', 'Xã Châu Thành'),
    ('32', '00523', 'Phường Vĩnh Phước'),
    ('30', '00524', 'Xã Hồ Tràm'),
    ('05', '00525', 'Phường Lê Ích Mộc'),
    ('02', '00526', 'Xã Thái Thụy'),
    ('02', '00527', 'Xã Quỳnh Phụ'),
    ('08', '00528', 'Phường Việt Hưng'),
    ('32', '00529', 'Phường Mỹ Xuyên'),
    ('10', '00530', 'Phường Đa Mai'),
    ('18', '00531', 'Xã Vĩnh Hòa'),
    ('05', '00532', 'Phường Bạch Đằng'),
    ('29', '00533', 'Phường B'' Lao'),
    ('05', '00534', 'Phường Hải Dương'),
    ('28', '00535', 'Xã Phù Cát'),
    ('16', '00536', 'Xã Tân Đông'),
    ('32', '00537', 'Xã Mỹ Hương'),
    ('01', '00538', 'Xã Thanh Trì'),
    ('24', '00539', 'Xã An Bình'),
    ('29', '00540', 'Xã Bắc Bình'),
    ('08', '00541', 'Phường Hồng Gai'),
    ('29', '00542', 'Xã Hiệp Thạnh'),
    ('31', '00543', 'Phường Tô Hiệu'),
    ('13', '00544', 'Xã Hải Anh'),
    ('16', '00545', 'Xã Mỹ Thọ'),
    ('29', '00546', 'Xã Đức Linh'),
    ('22', '00547', 'Xã Phước An'),
    ('16', '00548', 'Xã Bình Phú'),
    ('22', '00549', 'Xã Trị An'),
    ('32', '00550', 'Xã Tân Hòa'),
    ('32', '00551', 'Xã Phú Lộc'),
    ('03', '00552', 'Phường Đông Hà'),
    ('24', '00553', 'Xã Tân Quới'),
    ('24', '00554', 'Phường Phước Hậu'),
    ('04', '00555', 'Xã Chân Mây – Lăng Cô'),
    ('05', '00556', 'Phường Đông Hải'),
    ('10', '00557', 'Xã Tân Yên'),
    ('16', '00558', 'Phường Mỹ Phong'),
    ('18', '00559', 'Xã Tri Tôn'),
    ('29', '00560', 'Xã Hàm Thuận'),
    ('24', '00561', 'Xã Song Phú'),
    ('10', '00562', 'Phường Phù Khê'),
    ('18', '00563', 'Xã Bình Thạnh Đông'),
    ('24', '00564', 'Xã Châu Thành'),
    ('16', '00565', 'Phường Mỹ Ngãi'),
    ('28', '00566', 'Phường An Khê'),
    ('15', '00567', 'Xã Cần Đước'),
    ('07', '00568', 'Xã Nông Cống'),
    ('20', '00569', 'Phường Đông Kinh'),
    ('18', '00570', 'Xã Chợ Vàm'),
    ('05', '00571', 'Phường Thành Đông'),
    ('29', '00572', 'Phường Mũi Né'),
    ('32', '00573', 'Phường An Bình'),
    ('16', '00574', 'Xã An Long'),
    ('33', '00575', 'Phường Lý Văn Lâm'),
    ('01', '00576', 'Xã Hòa Phú'),
    ('15', '00577', 'Xã Đức Hòa'),
    ('30', '00578', 'Xã Thái Mỹ'),
    ('24', '00579', 'Xã Mỏ Cày'),
    ('33', '00580', 'Xã Trí Phải'),
    ('06', '00581', 'Xã Vĩnh Phú'),
    ('27', '00582', 'Xã Tây Hòa'),
    ('04', '00583', 'Phường Vỹ Dạ'),
    ('24', '00584', 'Xã Phú Quới'),
    ('01', '00585', 'Phường Yên Nghĩa'),
    ('29', '00586', 'Xã Cư Jút'),
    ('29', '00587', 'Phường 2 Bảo Lộc'),
    ('28', '00588', 'Xã Tuy Phước Bắc'),
    ('24', '00589', 'Phường Long Châu'),
    ('29', '00590', 'Phường Phước Hội'),
    ('14', '00591', 'Xã Phước Hậu'),
    ('03', '00592', 'Xã Lệ Thủy'),
    ('18', '00593', 'Xã Tân Hội'),
    ('28', '00594', 'Phường An Nhơn'),
    ('28', '00595', 'Xã Phú Thiện'),
    ('05', '00596', 'Phường Lưu Kiếm'),
    ('01', '00597', 'Xã Hưng Đạo'),
    ('23', '00598', 'Phường Trương Quang Trọng'),
    ('15', '00599', 'Xã Mỹ Yên'),
    ('15', '00600', 'Xã Bến Cầu'),
    ('21', '00601', 'Phường Điện Biên Phủ'),
    ('19', '00602', 'Phường Phổ Yên'),
    ('02', '00603', 'Xã Đông Hưng'),
    ('30', '00604', 'Xã Ngãi Giao'),
    ('18', '00605', 'Xã An Phú'),
    ('04', '00606', 'Phường Kim Long'),
    ('12', '00607', 'Phường Hải Vân'),
    ('01', '00608', 'Xã Bát Tràng'),
    ('28', '00609', 'Xã Tây Sơn'),
    ('29', '00610', 'Phường Cam Ly - Đà Lạt'),
    ('07', '00611', 'Xã Thiệu Hóa'),
    ('27', '00612', 'Xã Hòa Phú'),
    ('24', '00613', 'Xã Ngãi Tứ'),
    ('02', '00614', 'Xã Khoái Châu'),
    ('28', '00615', 'Phường Thống Nhất'),
    ('29', '00616', 'Xã Đinh Văn - Lâm Hà'),
    ('01', '00617', 'Phường Xuân Đỉnh'),
    ('27', '00618', 'Xã Ea Phê'),
    ('02', '00619', 'Xã Long Hưng'),
    ('29', '00620', 'Xã Đức Lập'),
    ('01', '00621', 'Xã Kim Anh'),
    ('30', '00622', 'Phường Tân Định'),
    ('27', '00623', 'Xã Krông Ana'),
    ('30', '00624', 'Phường Xuân Hòa'),
    ('16', '00625', 'Xã Long Định'),
    ('22', '00626', 'Phường Tam Phước'),
    ('06', '00627', 'Xã Xuân Lãng'),
    ('30', '00628', 'Xã Long Điền'),
    ('02', '00629', 'Xã Kiến Xương'),
    ('06', '00630', 'Xã Tam Dương'),
    ('07', '00631', 'Phường Ngọc Sơn'),
    ('02', '00632', 'Xã Nguyễn Văn Linh'),
    ('29', '00633', 'Phường Bình Thuận'),
    ('11', '00634', 'Xã Yên Thành'),
    ('01', '00635', 'Xã Liên Minh'),
    ('08', '00636', 'Phường Hà Lầm'),
    ('04', '00637', 'Xã Phú Vinh'),
    ('27', '00638', 'Phường Đông Hòa'),
    ('01', '00639', 'Xã Đan Phượng'),
    ('22', '00640', 'Xã Xuân Đông'),
    ('01', '00641', 'Xã Trần Phú'),
    ('29', '00642', 'Xã Hoài Đức'),
    ('16', '00643', 'Xã Thanh Bình'),
    ('06', '00644', 'Xã Vĩnh Tường'),
    ('16', '00645', 'Xã Long Hưng'),
    ('31', '00646', 'Xã Phù Yên'),
    ('32', '00647', 'Xã Ngọc Tố'),
    ('05', '00648', 'Xã An Lão'),
    ('30', '00649', 'Xã Bình Lợi'),
    ('07', '00650', 'Xã Nga Sơn'),
    ('05', '00651', 'Phường Hoà Bình'),
    ('33', '00652', 'Phường Hòa Thành'),
    ('28', '00653', 'Phường Quy Nhơn Đông'),
    ('06', '00654', 'Xã Cẩm Khê'),
    ('24', '00655', 'Phường Phú Khương'),
    ('30', '00656', 'Phường Sài Gòn'),
    ('31', '00657', 'Xã Thuận Châu'),
    ('11', '00658', 'Xã Hợp Minh'),
    ('01', '00659', 'Phường Tây Mỗ'),
    ('02', '00660', 'Xã Hoàng Hoa Thám'),
    ('24', '00661', 'Xã Tân Thành Bình'),
    ('16', '00662', 'Xã Tân Khánh Trung'),
    ('18', '00663', 'Phường Long Phú'),
    ('32', '00664', 'Phường Phước Thới'),
    ('18', '00665', 'Xã Thạnh Hưng'),
    ('16', '00666', 'Phường Mỹ Trà'),
    ('15', '00667', 'Xã Hậu Nghĩa'),
    ('29', '00668', 'Xã Tánh Linh'),
    ('05', '00669', 'Xã Gia Lộc'),
    ('19', '00670', 'Phường Linh Sơn'),
    ('13', '00671', 'Phường Tây Hoa Lư'),
    ('08', '00672', 'Phường Móng Cái 1'),
    ('27', '00673', 'Xã Dliê Ya'),
    ('02', '00674', 'Xã Nghĩa Trụ'),
    ('13', '00675', 'Xã Giao Thuỷ'),
    ('16', '00676', 'Phường Sơn Qui'),
    ('10', '00677', 'Xã Mỹ Thái'),
    ('06', '00678', 'Xã Bình Nguyên'),
    ('28', '00679', 'Phường Hội Phú'),
    ('33', '00680', 'Xã Sông Đốc'),
    ('16', '00681', 'Xã Thanh Hưng'),
    ('18', '00682', 'Xã U Minh Thượng'),
    ('05', '00683', 'Xã Phú Thái'),
    ('30', '00684', 'Phường Bình Quới'),
    ('32', '00685', 'Xã Xà Phiên'),
    ('30', '00686', 'Phường Phú An'),
    ('11', '00687', 'Xã Đông Thành'),
    ('16', '00688', 'Xã Tân Dương'),
    ('13', '00689', 'Xã Xuân Giang'),
    ('10', '00690', 'Phường Đồng Nguyên'),
    ('11', '00691', 'Xã Nghi Lộc'),
    ('07', '00692', 'Phường Bỉm Sơn'),
    ('14', '00693', 'Phường Bảo An'),
    ('16', '00694', 'Xã Gia Thuận'),
    ('24', '00695', 'Xã Trà Côn'),
    ('28', '00696', 'Phường Quy Nhơn Bắc'),
    ('24', '00697', 'Xã Tân Thủy'),
    ('22', '00698', 'Xã Cẩm Mỹ'),
    ('02', '00699', 'Phường Trần Hưng Đạo'),
    ('22', '00700', 'Xã Đồng Phú'),
    ('28', '00701', 'Xã Đề Gi'),
    ('23', '00702', 'Phường Trà Câu'),
    ('24', '00703', 'Xã An Trường'),
    ('10', '00704', 'Phường Vũ Ninh'),
    ('10', '00705', 'Phường Tự Lạn'),
    ('01', '00706', 'Xã Thượng Phúc'),
    ('24', '00707', 'Phường Trà Vinh'),
    ('05', '00708', 'Xã Thanh Miện'),
    ('06', '00709', 'Xã Lương Sơn'),
    ('05', '00710', 'Xã Vĩnh Bảo'),
    ('32', '00711', 'Phường Long Tuyền'),
    ('18', '00712', 'Xã Đông Hòa'),
    ('13', '00713', 'Xã Hải Hậu'),
    ('14', '00714', 'Xã Diên Khánh'),
    ('29', '00715', 'Xã Đơn Dương'),
    ('05', '00716', 'Phường Thiên Hương'),
    ('14', '00717', 'Xã Xuân Hải'),
    ('06', '00718', 'Xã Phù Ninh'),
    ('32', '00719', 'Xã Cù Lao Dung'),
    ('22', '00720', 'Xã Xuân Bắc'),
    ('05', '00721', 'Xã Kiến Hải'),
    ('01', '00722', 'Xã Chuyên Mỹ'),
    ('19', '00723', 'Xã Phú Bình'),
    ('11', '00724', 'Xã Vạn An'),
    ('10', '00725', 'Xã Tiên Du'),
    ('22', '00726', 'Phường Phước Bình'),
    ('15', '00727', 'Xã Tân Tập'),
    ('04', '00728', 'Phường Mỹ Thượng'),
    ('13', '00729', 'Xã Hải Tiến'),
    ('18', '00730', 'Xã Gò Quao'),
    ('05', '00731', 'Phường An Phong'),
    ('07', '00732', 'Xã Sao Vàng'),
    ('28', '00733', 'Phường Hoài Nhơn Đông'),
    ('28', '00734', 'Phường Hoài Nhơn Bắc'),
    ('02', '00735', 'Xã Triệu Việt Vương'),
    ('16', '00736', 'Xã Vĩnh Bình'),
    ('15', '00737', 'Xã Thạnh Đức'),
    ('15', '00738', 'Xã Thủ Thừa'),
    ('11', '00739', 'Phường Hoàng Mai'),
    ('12', '00740', 'Xã Điện Bàn Tây'),
    ('16', '00741', 'Xã Tháp Mười'),
    ('27', '00742', 'Phường Bình Kiến'),
    ('11', '00743', 'Xã Minh Châu'),
    ('24', '00744', 'Xã Chợ Lách'),
    ('29', '00745', 'Xã Bảo Lâm 1'),
    ('10', '00746', 'Phường Yên Dũng'),
    ('15', '00747', 'Xã Phước Thạnh'),
    ('19', '00748', 'Phường Gia Sàng'),
    ('12', '00749', 'Phường Tam Kỳ'),
    ('13', '00750', 'Xã Hải Xuân'),
    ('16', '00751', 'Xã Long Tiên'),
    ('02', '00752', 'Phường Trà Lý'),
    ('11', '00753', 'Xã Vân Tụ'),
    ('02', '00754', 'Xã Vũ Thư'),
    ('19', '00755', 'Xã Phú Lương'),
    ('01', '00756', 'Xã Ngọc Hồi'),
    ('30', '00757', 'Xã Đất Đỏ'),
    ('07', '00758', 'Xã Hoằng Hóa'),
    ('05', '00759', 'Phường Nhị Chiểu'),
    ('27', '00760', 'Xã Ea Knuếc'),
    ('08', '00761', 'Phường Đông Triều'),
    ('27', '00762', 'Xã Ea Nuôl'),
    ('27', '00763', 'Xã Krông Năng'),
    ('14', '00764', 'Phường Bắc Cam Ranh'),
    ('30', '00765', 'Xã Phước Hải'),
    ('32', '00766', 'Xã Đại Hải'),
    ('18', '00767', 'Xã Vĩnh Bình'),
    ('04', '00768', 'Phường Thanh Thủy'),
    ('03', '00769', 'Xã Hoàn Lão'),
    ('15', '00770', 'Phường Thanh Điền'),
    ('10', '00771', 'Phường Nam Sơn'),
    ('02', '00772', 'Xã Việt Yên'),
    ('14', '00773', 'Phường Đông Ninh Hòa'),
    ('11', '00774', 'Xã An Châu'),
    ('28', '00775', 'Xã Phù Mỹ Đông'),
    ('04', '00776', 'Phường Thủy Xuân'),
    ('01', '00777', 'Xã Phú Cát'),
    ('05', '00778', 'Xã Mao Điền'),
    ('32', '00779', 'Xã Kế Sách'),
    ('18', '00780', 'Xã Vĩnh Phong'),
    ('06', '00781', 'Xã Thổ Tang'),
    ('28', '00782', 'Phường Hoài Nhơn'),
    ('11', '00783', 'Xã Hải Châu'),
    ('34', '00784', 'Phường An Tường'),
    ('11', '00785', 'Xã Quỳnh Văn'),
    ('05', '00786', 'Xã Kim Thành'),
    ('24', '00787', 'Xã Vĩnh Thành'),
    ('05', '00788', 'Xã Lai Khê'),
    ('15', '00789', 'Xã Phước Lý'),
    ('12', '00790', 'Xã Tam Xuân'),
    ('13', '00791', 'Xã Yên Cường'),
    ('10', '00792', 'Phường Mão Điền'),
    ('01', '00793', 'Xã Nam Phù'),
    ('28', '00794', 'Phường Bình Định'),
    ('32', '00795', 'Xã Vị Thanh 1'),
    ('10', '00796', 'Xã Gia Bình'),
    ('18', '00797', 'Xã Khánh Bình'),
    ('30', '00798', 'Xã Phú Giáo'),
    ('18', '00799', 'Xã Phú Hữu'),
    ('02', '00800', 'Xã Tiền Hải'),
    ('24', '00801', 'Xã Song Lộc'),
    ('11', '00802', 'Xã Tam Hợp'),
    ('10', '00803', 'Xã Kép'),
    ('02', '00804', 'Xã Phụ Dực'),
    ('30', '00805', 'Xã Phước Hòa'),
    ('22', '00806', 'Xã Long Phước'),
    ('23', '00807', 'Xã Sơn Tịnh'),
    ('24', '00808', 'Xã Vĩnh Xuân'),
    ('12', '00809', 'Phường Hội An Tây'),
    ('10', '00810', 'Xã Lục Ngạn'),
    ('18', '00811', 'Xã Định Mỹ'),
    ('19', '00812', 'Phường Quan Triều'),
    ('12', '00813', 'Xã Thăng Điền'),
    ('24', '00814', 'Xã Thạnh Phú'),
    ('10', '00815', 'Phường Phương Liễu'),
    ('18', '00816', 'Xã Long Thạnh'),
    ('19', '00817', 'Xã Kha Sơn'),
    ('30', '00818', 'Xã Bàu Bàng'),
    ('32', '00819', 'Xã Nhơn Mỹ'),
    ('02', '00820', 'Xã Lạc Đạo'),
    ('32', '00821', 'Xã Cờ Đỏ'),
    ('27', '00822', 'Xã Ea Na'),
    ('08', '00823', 'Phường Bãi Cháy'),
    ('01', '00824', 'Phường Tùng Thiện'),
    ('06', '00825', 'Xã Tân Lạc'),
    ('34', '00826', 'Xã Sơn Dương'),
    ('18', '00827', 'Xã Tân An'),
    ('19', '00828', 'Xã Điềm Thụy'),
    ('04', '00829', 'Xã Quảng Điền'),
    ('24', '00830', 'Phường Đông Thành'),
    ('13', '00831', 'Xã Giao Hoà'),
    ('20', '00832', 'Phường Hoàng Văn Thụ'),
    ('06', '00833', 'Xã Tu Vũ'),
    ('24', '00834', 'Xã Càng Long'),
    ('24', '00835', 'Xã Phong Thạnh'),
    ('22', '00836', 'Phường Chơn Thành'),
    ('28', '00837', 'Phường Bồng Sơn'),
    ('02', '00838', 'Phường Vũ Phúc'),
    ('07', '00839', 'Xã Hoa Lộc'),
    ('17', '00840', 'Xã Đức Thịnh'),
    ('18', '00841', 'Xã Vĩnh Xương'),
    ('23', '00842', 'Phường Đức Phổ'),
    ('10', '00843', 'Phường Phượng Sơn'),
    ('04', '00844', 'Phường Hóa Châu'),
    ('18', '00845', 'Xã Phú Hòa'),
    ('12', '00846', 'Phường Điện Bàn'),
    ('32', '00847', 'Xã Phú Hữu'),
    ('33', '00848', 'Xã Khánh Hưng'),
    ('24', '00849', 'Xã Tân Hòa'),
    ('16', '00850', 'Xã An Thạnh Thủy'),
    ('25', '00851', 'Phường Thục Phán'),
    ('17', '00852', 'Xã Can Lộc'),
    ('30', '00853', 'Phường Tam Long'),
    ('22', '00854', 'Phường Bình Long'),
    ('06', '00855', 'Xã Phùng Nguyên'),
    ('32', '00856', 'Xã Thạnh Xuân'),
    ('33', '00857', 'Xã Đá Bạc'),
    ('08', '00858', 'Xã Quảng Hà'),
    ('28', '00859', 'Xã Biển Hồ'),
    ('17', '00860', 'Xã Lộc Hà'),
    ('15', '00861', 'Phường Hoà Thành'),
    ('01', '00862', 'Phường Yên Sở'),
    ('13', '00863', 'Phường Phù Vân'),
    ('11', '00864', 'Xã Đức Châu'),
    ('30', '00865', 'Xã An Nhơn Tây'),
    ('11', '00866', 'Xã Thiên Nhẫn'),
    ('27', '00867', 'Xã Sơn Hòa'),
    ('07', '00868', 'Xã Tiên Trang'),
    ('07', '00869', 'Xã Kim Tân'),
    ('16', '00870', 'Phường Mỹ Phước Tây'),
    ('32', '00871', 'Xã Nhơn Ái'),
    ('13', '00872', 'Xã Xuân Hồng'),
    ('28', '00873', 'Phường An Phú'),
    ('05', '00874', 'Xã Gia Phúc'),
    ('09', '00875', 'Xã Mậu A'),
    ('02', '00876', 'Xã Bắc Tiên Hưng'),
    ('16', '00877', 'Xã Ngũ Hiệp'),
    ('11', '00878', 'Xã Xuân Lâm'),
    ('18', '00879', 'Phường Hà Tiên'),
    ('02', '00880', 'Xã Văn Giang'),
    ('14', '00881', 'Xã Tân Định'),
    ('05', '00882', 'Xã Tiên Lãng'),
    ('16', '00883', 'Xã Đồng Sơn'),
    ('04', '00884', 'Xã Đan Điền'),
    ('07', '00885', 'Xã Lưu Vệ'),
    ('07', '00886', 'Xã Vĩnh Lộc'),
    ('11', '00887', 'Xã Thuần Trung'),
    ('24', '00888', 'Xã Tam Ngãi'),
    ('27', '00889', 'Xã Ô Loan'),
    ('24', '00890', 'Xã Hưng Mỹ'),
    ('30', '00891', 'Xã Nhuận Đức'),
    ('06', '00892', 'Xã Tam Hồng'),
    ('05', '00893', 'Phường Nam Triệu'),
    ('18', '00894', 'Phường Vĩnh Tế'),
    ('15', '00895', 'Xã Mỹ Lộc'),
    ('10', '00896', 'Phường Quế Võ'),
    ('32', '00897', 'Xã An Ninh'),
    ('15', '00898', 'Xã Truông Mít'),
    ('02', '00899', 'Xã Diên Hà'),
    ('13', '00900', 'Xã Cổ Lễ'),
    ('27', '00901', 'Xã Ea Kly'),
    ('24', '00902', 'Xã Giao Long'),
    ('32', '00903', 'Xã Gia Hòa'),
    ('13', '00904', 'Xã Yên Khánh'),
    ('27', '00905', 'Xã Tuy An Đông'),
    ('32', '00906', 'Xã Đông Phước'),
    ('16', '00907', 'Xã Hậu Mỹ'),
    ('01', '00908', 'Xã Bất Bạt'),
    ('17', '00909', 'Xã Đức Thọ'),
    ('29', '00910', 'Phường Langbiang - Đà Lạt'),
    ('16', '00911', 'Xã Tân Thuận Bình'),
    ('18', '00912', 'Xã Phú An'),
    ('07', '00913', 'Xã Thọ Phú'),
    ('24', '00914', 'Xã Tập Sơn'),
    ('16', '00915', 'Xã Tân Hồng'),
    ('25', '00916', 'Xã Minh Khai'),
    ('07', '00917', 'Xã Xuân Thái'),
    ('23', '00918', 'Xã Cà Đam'),
    ('11', '00919', 'Xã Na Loi'),
    ('31', '00920', 'Xã Mường Lèo'),
    ('09', '00921', 'Xã Bản Liền'),
    ('34', '00922', 'Xã Cao Bồ'),
    ('07', '00923', 'Xã Tam Thanh'),
    ('28', '00924', 'Xã Ia Púch'),
    ('07', '00925', 'Xã Na Mèo'),
    ('07', '00926', 'Xã Bát Mọt'),
    ('07', '00927', 'Xã Sơn Thủy'),
    ('07', '00928', 'Xã Mường Chanh'),
    ('19', '00929', 'Xã Quảng Bạch'),
    ('20', '00930', 'Xã Đoàn Kết'),
    ('04', '00931', 'Xã A Lưới 5'),
    ('19', '00932', 'Xã Thượng Quan'),
    ('03', '00933', 'Xã Thượng Trạch'),
    ('03', '00934', 'Xã Hướng Lập'),
    ('07', '00935', 'Xã Nhi Sơn'),
    ('28', '00936', 'Xã Ia Mơ'),
    ('26', '00937', 'Xã Mù Cả'),
    ('19', '00938', 'Xã Sảng Mộc'),
    ('07', '00939', 'Xã Trung Sơn'),
    ('12', '00940', 'Xã Đắc Pring'),
    ('20', '00941', 'Xã Quý Hòa'),
    ('07', '00942', 'Xã Mường Mìn'),
    ('11', '00943', 'Xã Hữu Khuông'),
    ('12', '00944', 'Xã La Dêê'),
    ('18', '00945', 'Xã Sơn Hải'),
    ('09', '00946', 'Xã Chế Tạo'),
    ('12', '00947', 'Xã Tân Hiệp'),
    ('18', '00948', 'Xã Hòn Nghệ'),
    ('12', '00949', 'Xã La Êê'),
    ('28', '00950', 'Xã Canh Liên'),
    ('28', '00951', 'Xã Nhơn Châu'),
    ('09', '00952', 'Xã Tà Xi Láng'),
    ('18', '00953', 'Đặc khu Thổ Châu'),
    ('18', '00954', 'Xã Tiên Hải'),
    ('28', '00955', 'Xã An Toàn'),
    ('09', '00956', 'Xã Nậm Xé'),
    ('08', '00957', 'Xã Cái Chiên'),
    ('05', '00958', 'Đặc khu Bạch Long Vĩ'),
    ('14', '00959', 'Đặc khu Trường Sa'),
    ('03', '00960', 'Đặc khu Cồn Cỏ'),
    ('12', '00961', 'Đặc khu Hoàng Sa')
) AS w(province_code, code, name)
JOIN provinces p ON p.code = w.province_code;

-- =============================================================================
-- 21. GRANTS
-- =============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO service_role;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT SELECT ON public.user_feeds TO authenticated;
GRANT SELECT ON public.user_connections_view TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_schedules TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.interview_schedules_id_seq TO authenticated;
GRANT SELECT, INSERT ON public.job_view_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.job_view_logs_id_seq TO authenticated;

-- =============================================================================
-- 22. RPCs — small app helpers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_default_member_cv(p_cv_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_me       BIGINT;
    v_owner_id BIGINT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
    END IF;

    SELECT user_id INTO v_owner_id
      FROM public.member_cvs
     WHERE id = p_cv_id
       AND deleted_at IS NULL;

    IF v_owner_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'error', 'not_found');
    END IF;

    IF v_owner_id <> v_me THEN
        RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;

    UPDATE public.member_cvs
       SET is_default = FALSE
     WHERE user_id = v_me
       AND is_default = TRUE
       AND id <> p_cv_id;

    UPDATE public.member_cvs
       SET is_default = TRUE
     WHERE id = p_cv_id;

    RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.poll_votes_counter_trigger()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options SET vote_count = GREATEST(0, vote_count - 1) WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.count_applications_per_job(p_job_ids BIGINT[])
RETURNS TABLE(job_id BIGINT, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ja.job_id, COUNT(*)::BIGINT
    FROM public.job_applications ja
   WHERE ja.job_id = ANY(p_job_ids)
   GROUP BY ja.job_id;
$$;

CREATE OR REPLACE FUNCTION public.get_distinct_audit_actions()
RETURNS TABLE(action TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.action
    FROM public.audit_logs a
   ORDER BY a.action;
$$;

GRANT EXECUTE ON FUNCTION public.set_default_member_cv(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_applications_per_job(BIGINT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_distinct_audit_actions() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_audit_log_count(
  p_search TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT count(*)::bigint
    FROM public.audit_logs a
   WHERE (p_action IS NULL OR a.action = p_action)
     AND (p_entity_type IS NULL OR a.entity_type = p_entity_type)
     AND (p_search IS NULL OR p_search = ''
          OR a.action ILIKE '%' || p_search || '%'
          OR a.entity_type ILIKE '%' || p_search || '%'
          OR a.reason ILIKE '%' || p_search || '%')
$$;

GRANT EXECUTE ON FUNCTION public.get_audit_log_count(TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_distinct_audit_entity_types()
RETURNS TABLE(entity_type TEXT)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT DISTINCT a.entity_type
    FROM public.audit_logs a
   WHERE a.entity_type IS NOT NULL
   ORDER BY a.entity_type
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_audit_entity_types() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_post(
    p_content TEXT,
    p_post_type TEXT DEFAULT 'text',
    p_media JSONB DEFAULT NULL,
    p_visibility TEXT DEFAULT 'public'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_content TEXT := btrim(COALESCE(p_content, ''));
    v_row public.posts%ROWTYPE;
BEGIN
    v_me := public.auth_user_id();
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF NOT public.is_active_user() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'accountInactive');
    END IF;

    IF p_post_type NOT IN ('text','image','video','article','poll') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidPostType');
    END IF;

    IF p_visibility NOT IN ('public','connections','private') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidVisibility');
    END IF;

    IF v_content = '' AND p_media IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent');
    END IF;

    INSERT INTO public.posts(author_id, content, post_type, media, visibility)
    VALUES (v_me, v_content, p_post_type, p_media, p_visibility)
    RETURNING * INTO v_row;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'post', jsonb_build_object(
            'id', v_row.id,
            'author_id', v_row.author_id,
            'content', v_row.content,
            'post_type', v_row.post_type,
            'media', v_row.media,
            'visibility', v_row.visibility,
            'created_at', v_row.created_at
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_post(TEXT, TEXT, JSONB, TEXT) TO authenticated;

-- =============================================================================
-- 23. RPCs — network_suggestions + expire_due_jobs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_quick_suggestions(p_user_id BIGINT, p_limit INT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    DELETE FROM public.network_suggestions WHERE user_id = p_user_id;
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT p_user_id, u.id, 1
      FROM public.users u
     WHERE u.deleted_at IS NULL
       AND u.status = 'active'
       AND u.account_type <> 'admin'
       AND u.id <> p_user_id
       AND NOT EXISTS (
         SELECT 1 FROM public.connections c
          WHERE (c.requester_id = p_user_id AND c.receiver_id = u.id)
             OR (c.requester_id = u.id AND c.receiver_id = p_user_id)
       )
       AND NOT EXISTS (
         SELECT 1 FROM public.user_blocks b
          WHERE (b.blocker_id = p_user_id AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = p_user_id)
       )
       AND (
         (u.account_type = 'member' AND EXISTS (
            SELECT 1 FROM public.member_profiles mp
             WHERE mp.user_id = u.id
               AND mp.deleted_at IS NULL
               AND mp.profile_visibility = 'public'
          ))
         OR
         (u.account_type = 'company' AND EXISTS (
            SELECT 1 FROM public.company_profiles cp
             WHERE cp.user_id = u.id
               AND cp.deleted_at IS NULL
               AND cp.verification_status = 'verified'
          ))
       )
     ORDER BY u.id DESC LIMIT GREATEST(p_limit, 1) * 5;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_due_jobs()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_count INT;
BEGIN
    WITH updated AS (
        UPDATE public.jobs SET status = 'expired', updated_at = NOW()
         WHERE status = 'active' AND deleted_at IS NULL
           AND expires_at IS NOT NULL AND expires_at <= NOW()
        RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_count FROM updated;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_quick_suggestions(BIGINT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_due_jobs() TO authenticated;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule('joblink-expire-jobs', '*/15 * * * *', 'SELECT public.expire_due_jobs();');
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- =============================================================================
-- 24. RPCs — get_home_feed (UNIFIED) — phiên bản 049 mới nhất
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_home_feed(
    p_posts_cursor TIMESTAMPTZ DEFAULT NULL,
    p_posts_limit INT DEFAULT 20,
    p_suggestion_limit INT DEFAULT 12
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_me BIGINT; v_stats JSONB; v_posts JSONB; v_jobs JSONB;
    v_suggestions JSONB; v_suggested_jobs JSONB; v_connection_ids BIGINT[];
    v_next_cursor TIMESTAMPTZ;
    v_post_ids BIGINT[]; v_job_ids BIGINT[];
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0),
            'suggestions', '[]'::jsonb, 'suggested_jobs', '[]'::jsonb, 'posts', '[]'::jsonb,
            'jobs', '[]'::jsonb, 'connection_ids', '[]'::jsonb, 'me', NULL, 'next_cursor', NULL);
    END IF;
    SELECT jsonb_build_object('connection_count', u.connection_count, 'profile_view_count', u.profile_view_count)
      INTO v_stats FROM public.users u WHERE u.id = v_me;
    SELECT COALESCE(array_agg(to_user_id), '{}') INTO v_connection_ids
      FROM public.user_connections_view WHERE from_user_id = v_me AND status = 'accepted';

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (
        SELECT u.id AS "userId", u.account_type AS role,
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline"
          FROM public.users u
          LEFT JOIN public.member_profiles mp ON mp.user_id = u.id
          LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
         WHERE u.deleted_at IS NULL
           AND u.status = 'active'
           AND u.account_type <> 'admin'
           AND u.id <> v_me
           AND NOT EXISTS (
             SELECT 1 FROM public.connections c
              WHERE (c.requester_id = v_me AND c.receiver_id = u.id)
                 OR (c.requester_id = u.id AND c.receiver_id = v_me)
           )
           AND NOT EXISTS (
             SELECT 1 FROM public.user_blocks b
              WHERE (b.blocker_id = v_me AND b.blocked_id = u.id)
                 OR (b.blocker_id = u.id AND b.blocked_id = v_me)
           )
           AND (
             (u.account_type = 'member' AND mp.deleted_at IS NULL AND mp.profile_visibility = 'public')
             OR
             (u.account_type = 'company' AND cp.deleted_at IS NULL AND cp.verification_status = 'verified')
           )
         ORDER BY RANDOM() LIMIT p_suggestion_limit
      ) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggested_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId",
                   COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl",
                   cp.verification_status = 'verified' AS "companyVerified",
                   pv.name AS "provinceName", w.name AS "wardName",
                   jt.name AS "jobTypeName", wm.name AS "workModeName",
                   j.salary_min AS "salaryMin", j.salary_max AS "salaryMax",
                   j.salary_visible AS "salaryVisible", j.created_at AS "createdAt",
                   FALSE AS "viewerSaved", FALSE AS "viewerApplied"
              FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
              LEFT JOIN public.provinces pv ON pv.id = j.province_id
              LEFT JOIN public.wards w ON w.id = j.ward_id
              LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
              LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
             WHERE j.status = 'active' AND j.deleted_at IS NULL
               AND (j.expires_at IS NULL OR j.expires_at > NOW())
             ORDER BY j.created_at DESC LIMIT 5) s;

    WITH combined_stream AS (
        SELECT post_id AS id, 'post' AS kind, created_at
          FROM public.user_feeds
         WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor)
        UNION ALL
        SELECT id, 'job' AS kind, created_at
          FROM public.jobs
         WHERE status = 'active' AND deleted_at IS NULL
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor)
    ),
    paginated_stream AS (
        SELECT id, kind, created_at FROM combined_stream
         ORDER BY created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(array_agg(id) FILTER (WHERE kind = 'post'), '{}'),
           COALESCE(array_agg(id) FILTER (WHERE kind = 'job'), '{}'),
           MIN(created_at)
      INTO v_post_ids, v_job_ids, v_next_cursor FROM paginated_stream;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_posts
      FROM (SELECT p.id, p.author_id AS "authorId", p.content, p.post_type AS "postType",
                   p.media, p.visibility, p.created_at AS "createdAt",
                   jsonb_build_object('userId', p.author_id, 'role', u.account_type,
                       'displayName', COALESCE(mp.full_name, cp.name),
                       'avatarUrl', COALESCE(mp.avatar_url, cp.logo_url),
                       'headline', COALESCE(mp.headline, cp.industry)) AS author,
                   p.reaction_count AS "reactionCount", p.comment_count AS "commentCount",
                   p.share_count AS "shareCount",
                   EXISTS(SELECT 1 FROM public.post_reactions pr
                           WHERE pr.post_id = p.id AND pr.user_id = v_me) AS "viewerReacted",
                   CASE WHEN p.post_type = 'poll' THEN (
                       SELECT COALESCE(jsonb_agg(jsonb_build_object('id', po.id, 'optionText', po.option_text,
                           'voteCount', po.vote_count, 'viewerVoted', CASE WHEN v_me IS NULL THEN FALSE
                               ELSE EXISTS(SELECT 1 FROM public.poll_votes pv WHERE pv.option_id = po.id AND pv.user_id = v_me)
                           END) ORDER BY po.id), '[]'::jsonb)
                       FROM public.poll_options po WHERE po.post_id = p.id)
                   ELSE NULL END AS "pollOptions"
              FROM unnest(v_post_ids) f(id) JOIN public.posts p ON p.id = f.id
              JOIN public.users u ON u.id = p.author_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = p.author_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = p.author_id
             WHERE p.status = 'active' AND p.deleted_at IS NULL
               AND (p.visibility = 'public' OR p.author_id = v_me
                 OR (p.visibility = 'connections' AND public.is_connected_with(p.author_id)))
             ORDER BY p.created_at DESC) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId",
                   COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl",
                   cp.verification_status = 'verified' AS "companyVerified",
                   pv.name AS "provinceName", w.name AS "wardName",
                   jt.name AS "jobTypeName", wm.name AS "workModeName",
                   j.salary_min AS "salaryMin", j.salary_max AS "salaryMax",
                   j.salary_visible AS "salaryVisible", j.created_at AS "createdAt",
                   EXISTS(SELECT 1 FROM public.saved_jobs sj
                           WHERE sj.job_id = j.id AND sj.user_id = v_me) AS "viewerSaved",
                   EXISTS(SELECT 1 FROM public.job_applications ja
                           WHERE ja.job_id = j.id AND ja.applicant_id = v_me
                             AND ja.status <> 'withdrawn') AS "viewerApplied"
              FROM unnest(v_job_ids) f(id) JOIN public.jobs j ON j.id = f.id
              JOIN public.users u ON u.id = j.company_user_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
              LEFT JOIN public.provinces pv ON pv.id = j.province_id
              LEFT JOIN public.wards w ON w.id = j.ward_id
              LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
              LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
             ORDER BY j.created_at DESC) s;

    RETURN jsonb_build_object('stats', v_stats, 'suggestions', v_suggestions,
        'suggested_jobs', v_suggested_jobs, 'posts', v_posts, 'jobs', v_jobs,
        'connection_ids', to_jsonb(v_connection_ids), 'me', v_me, 'next_cursor', v_next_cursor);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_feed(TIMESTAMPTZ, INT, INT) TO authenticated;

-- =============================================================================
-- 24. RPCs — get_network_overview (phiên bản 047 fixed)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_network_overview(p_suggestion_limit INT DEFAULT 24)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_me BIGINT;
    v_suggestions JSONB; v_connections JSONB; v_incoming JSONB; v_outgoing JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('suggestions', '[]'::jsonb, 'connections', '[]'::jsonb,
            'incoming', '[]'::jsonb, 'outgoing', '[]'::jsonb);
    END IF;
    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (SELECT c.suggested_user_id AS "userId", u.account_type AS role,
                   COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location"
              FROM public.network_suggestions c
              JOIN public.users u ON u.id = c.suggested_user_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = u.id
              LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE c.user_id = v_me ORDER BY RANDOM() LIMIT p_suggestion_limit) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_connections
      FROM (SELECT CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END AS "userId",
                   u.account_type AS role, COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location",
                   c.id AS "connectionId",
                   COALESCE(c.responded_at, c.requested_at) AS "connectedAt"
              FROM public.connections c
              JOIN public.users u ON u.id = (CASE WHEN c.requester_id = v_me THEN c.receiver_id ELSE c.requester_id END)
              LEFT JOIN public.member_profiles mp ON mp.user_id = u.id
              LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE (c.requester_id = v_me OR c.receiver_id = v_me) AND c.status = 'accepted'
             ORDER BY c.responded_at DESC NULLS LAST, c.requested_at DESC LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_incoming
      FROM (SELECT c.requester_id AS "userId", u.account_type AS role,
                   COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location",
                   c.id AS "connectionId", c.requested_at AS "requestedAt", 'incoming' AS direction
              FROM public.connections c JOIN public.users u ON u.id = c.requester_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = c.requester_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = c.requester_id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE c.receiver_id = v_me AND c.status = 'pending'
             ORDER BY c.requested_at DESC LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_outgoing
      FROM (SELECT c.receiver_id AS "userId", u.account_type AS role,
                   COALESCE(mp.full_name, cp.name) AS "displayName",
                   COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
                   COALESCE(mp.headline, cp.industry) AS "headline",
                   NULLIF(concat_ws(', ', COALESCE(md.name, cd.name),
                       COALESCE(mpr.name, cpr.name)), '') AS "location",
                   c.id AS "connectionId", c.requested_at AS "requestedAt", 'outgoing' AS direction
              FROM public.connections c JOIN public.users u ON u.id = c.receiver_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = c.receiver_id
              LEFT JOIN public.company_profiles cp ON cp.user_id = c.receiver_id
              LEFT JOIN public.provinces mpr ON mpr.id = mp.province_id
              LEFT JOIN public.wards md ON md.id = mp.ward_id
              LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
              LEFT JOIN public.wards cd ON cd.id = cp.ward_id
             WHERE c.requester_id = v_me AND c.status = 'pending'
             ORDER BY c.requested_at DESC LIMIT 50) s;

    RETURN jsonb_build_object('suggestions', v_suggestions, 'connections', v_connections,
        'incoming', v_incoming, 'outgoing', v_outgoing);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_network_overview(INT) TO authenticated;

-- =============================================================================
-- 25. RPCs — get_profile_detail + get_profile_edit_overview
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_detail(p_target_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_target public.users%ROWTYPE; v_is_owner BOOLEAN;
    v_relation JSONB; v_conn RECORD; v_profile JSONB;
    v_province JSONB; v_ward JSONB; v_is_visible BOOLEAN;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB;
    v_follower_cnt INT; v_is_following BOOLEAN; v_visibility TEXT;
    v_is_connected BOOLEAN := FALSE; v_is_admin BOOLEAN := FALSE;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN NULL; END IF;
    SELECT * INTO v_target FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL;
    IF v_target.id IS NULL THEN RETURN NULL; END IF;
    v_is_owner := (v_me = v_target.id);
    v_is_admin := public.is_admin();

    IF v_is_owner THEN v_relation := jsonb_build_object('kind', 'self');
    ELSE
        SELECT c.id, c.requester_id, c.status INTO v_conn FROM public.connections c
         WHERE (c.requester_id = v_me AND c.receiver_id = p_target_user_id)
            OR (c.requester_id = p_target_user_id AND c.receiver_id = v_me) LIMIT 1;
        IF v_conn.id IS NULL THEN v_relation := jsonb_build_object('kind', 'none');
        ELSIF v_conn.status = 'accepted' THEN
            v_is_connected := TRUE;
            v_relation := jsonb_build_object('kind', 'accepted', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'rejected' THEN v_relation := jsonb_build_object('kind', 'rejected', 'connectionId', v_conn.id);
        ELSIF v_conn.status = 'blocked' THEN v_relation := jsonb_build_object('kind', 'blocked', 'connectionId', v_conn.id);
        ELSIF v_conn.requester_id = v_me THEN v_relation := jsonb_build_object('kind', 'pending_outgoing', 'connectionId', v_conn.id);
        ELSE v_relation := jsonb_build_object('kind', 'pending_incoming', 'connectionId', v_conn.id); END IF;
    END IF;

    IF v_target.account_type = 'company' THEN
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
    v_is_visible := v_is_admin OR v_is_owner OR v_visibility = 'public'
        OR (v_visibility = 'connections' AND v_is_connected);
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

CREATE OR REPLACE FUNCTION public.get_profile_edit_overview()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_email TEXT; v_role TEXT;
    v_profile JSONB; v_province JSONB; v_ward JSONB;
    v_experiences JSONB; v_educations JSONB; v_skills JSONB; v_cvs JSONB; v_provinces JSONB;
BEGIN
    SELECT u.id, u.email, u.account_type INTO v_me, v_email, v_role
      FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'member' THEN RETURN NULL; END IF;
    SELECT to_jsonb(mp) INTO v_profile FROM public.member_profiles mp
     WHERE mp.user_id = v_me AND mp.deleted_at IS NULL;
    IF v_profile IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('id', p.id, 'name', p.name) INTO v_province
      FROM public.provinces p WHERE p.id = (v_profile->>'province_id')::BIGINT LIMIT 1;
    SELECT jsonb_build_object('id', d.id, 'name', d.name) INTO v_ward
      FROM public.wards d WHERE d.id = (v_profile->>'ward_id')::BIGINT LIMIT 1;
    SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.is_current DESC, e.start_date DESC), '[]'::jsonb)
      INTO v_experiences FROM public.member_experiences e WHERE e.user_id = v_me AND e.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(to_jsonb(ed) ORDER BY ed.start_date DESC NULLS LAST), '[]'::jsonb)
      INTO v_educations FROM public.member_educations ed WHERE ed.user_id = v_me AND ed.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', ms.id, 'name', ms.name) ORDER BY ms.name), '[]'::jsonb)
      INTO v_skills FROM public.member_skills ms WHERE ms.user_id = v_me;
    SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.is_default DESC, c.created_at DESC), '[]'::jsonb)
      INTO v_cvs FROM public.member_cvs c WHERE c.user_id = v_me AND c.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'code', p.code, 'name', p.name,
        'name_en', p.name_en, 'sort_order', p.sort_order, 'is_active', p.is_active) ORDER BY p.sort_order, p.name), '[]'::jsonb)
      INTO v_provinces FROM public.provinces p WHERE p.is_active = TRUE AND p.deleted_at IS NULL;
    RETURN jsonb_build_object('userId', v_me, 'email', v_email, 'profile', v_profile,
        'province', v_province, 'ward', v_ward, 'experiences', v_experiences,
        'educations', v_educations, 'skills', v_skills, 'cvs', v_cvs, 'provinces', v_provinces);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_edit_overview() TO authenticated;

-- =============================================================================
-- 26. RPCs — get_company_public_overview + follow toggles
-- =============================================================================

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
       AND u.account_type = 'company'
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
    SELECT u.account_type, u.status, cp.verification_status
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

    SELECT u.account_type, u.status INTO v_target_role, v_target_status
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
                'role', COALESCE(u.account_type, 'member'),
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


-- =============================================================================
-- 27. RPCs — Company Dashboard
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_company_dashboard_overview()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_active_jobs INT; v_total_apps INT;
    v_apps_this_month INT; v_hires_total INT; v_job_views INT;
    v_recent_jobs JSONB; v_recent_apps JSONB;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL OR v_role <> 'company' THEN RETURN NULL; END IF;
    PERFORM public.expire_due_jobs();
    SELECT COUNT(*)::INT INTO v_active_jobs FROM public.jobs j
     WHERE j.company_user_id = v_me AND j.status = 'active' AND j.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_total_apps FROM public.job_applications a
     JOIN public.jobs j ON j.id = a.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;
    SELECT COUNT(*)::INT INTO v_apps_this_month FROM public.job_applications a
     JOIN public.jobs j ON j.id = a.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
       AND a.applied_at >= date_trunc('month', NOW());
    SELECT COUNT(*)::INT INTO v_hires_total FROM public.job_applications a
     JOIN public.jobs j ON j.id = a.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL AND a.status = 'hired';
    SELECT COUNT(*)::INT INTO v_job_views FROM public.job_view_logs v
     JOIN public.jobs j ON j.id = v.job_id WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', x.id, 'title', x.title, 'status', x.status,
        'createdAt', x.created_at, 'expiresAt', x.expires_at, 'applicantCount', x.applicant_count,
        'viewCount', x.view_count) ORDER BY x.created_at DESC), '[]'::jsonb) INTO v_recent_jobs
      FROM (SELECT j.id, j.title,
                   CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL AND j.expires_at <= NOW()
                        THEN 'expired' ELSE j.status END AS status,
                   j.created_at, j.expires_at,
                   (SELECT COUNT(*)::INT FROM public.job_applications a WHERE a.job_id = j.id) AS applicant_count,
                   (SELECT COUNT(*)::INT FROM public.job_view_logs v WHERE v.job_id = j.id) AS view_count
              FROM public.jobs j WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
             ORDER BY j.created_at DESC LIMIT 5) x;
    SELECT COALESCE(jsonb_agg(jsonb_build_object('applicationId', x.application_id, 'applicantId', x.applicant_id,
        'displayName', x.display_name, 'avatarUrl', x.avatar_url, 'headline', x.headline,
        'jobId', x.job_id, 'jobTitle', x.job_title, 'status', x.status, 'appliedAt', x.applied_at)
        ORDER BY x.applied_at DESC), '[]'::jsonb) INTO v_recent_apps
      FROM (SELECT a.id AS application_id, a.applicant_id,
                   COALESCE(mp.full_name, cp.name, u.email) AS display_name,
                   COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
                   COALESCE(mp.headline, cp.industry) AS headline,
                   j.id AS job_id, j.title AS job_title, a.status, a.applied_at
              FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
              JOIN public.users u ON u.id = a.applicant_id
              LEFT JOIN public.member_profiles mp ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
              LEFT JOIN public.company_profiles cp ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
             WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
             ORDER BY a.applied_at DESC LIMIT 5) x;
    RETURN jsonb_build_object('stats', jsonb_build_object('activeJobs', v_active_jobs,
        'totalApplications', v_total_apps, 'applicationsThisMonth', v_apps_this_month,
        'jobViews', v_job_views, 'hireRate', CASE WHEN v_total_apps > 0
            THEN ROUND((v_hires_total::NUMERIC / v_total_apps) * 100, 1) ELSE 0 END),
        'recentJobs', v_recent_jobs, 'recentApplicants', v_recent_apps);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_dashboard_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_company_jobs(
    p_status TEXT DEFAULT 'all', p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
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

CREATE OR REPLACE FUNCTION public.get_company_applicants(
    p_job_id BIGINT DEFAULT NULL, p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL, p_limit INT DEFAULT 50, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
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

CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id BIGINT, p_new_status TEXT, p_note TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_company_user_id BIGINT; v_old_status TEXT; v_now TIMESTAMPTZ;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
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

CREATE OR REPLACE FUNCTION public.update_job_status(p_job_id BIGINT, p_new_status TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_company_user_id BIGINT; v_old_status TEXT;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
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

-- =============================================================================
-- 28. RPCs — Jobs CRUD (create_job FIXED, get_job_detail, apply_to_job, etc.)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_job(
    p_title TEXT, p_description TEXT, p_requirements TEXT,
    p_province_id BIGINT, p_ward_id BIGINT,
    p_salary_min BIGINT, p_salary_max BIGINT, p_salary_visible BOOLEAN,
    p_job_type_id BIGINT, p_work_mode_id BIGINT, p_job_position_id BIGINT,
    p_position_title TEXT, p_status TEXT, p_expires_at TIMESTAMPTZ, p_skills TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_status TEXT; v_job_id BIGINT;
    v_skill_name TEXT; v_skill_id BIGINT; v_pos_title TEXT;
BEGIN
    SELECT u.id, u.account_type, u.status INTO v_me, v_role, v_status FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    IF btrim(COALESCE(p_title, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle'); END IF;
    IF char_length(btrim(p_title)) > 255 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong'); END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription'); END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange'); END IF;
    IF p_status NOT IN ('draft', 'active') THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode'); END IF;
    IF p_province_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince'); END IF;
    v_pos_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_pos_title IS NOT NULL AND char_length(v_pos_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong'); END IF;

    INSERT INTO public.jobs(company_user_id, title, description, requirements,
        province_id, ward_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, position_title, status, expires_at)
    VALUES (v_me, btrim(p_title), btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_ward_id, p_salary_min, p_salary_max, COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, v_pos_title, p_status, p_expires_at)
    RETURNING id INTO v_job_id;
    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;
            SELECT id INTO v_skill_id FROM public.skills WHERE name = v_skill_name LIMIT 1;
            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_id;
            END IF;
            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (v_job_id, v_skill_id, TRUE) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'jobId', v_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN, BIGINT, BIGINT, BIGINT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

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

CREATE OR REPLACE FUNCTION public.get_job_for_edit(p_job_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_job JSONB; v_skills JSONB; v_company_user_id BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN NULL; END IF;
    SELECT jsonb_build_object('id', j.id, 'title', j.title, 'description', j.description,
        'requirements', j.requirements, 'provinceId', j.province_id, 'wardId', j.ward_id,
        'salaryMin', j.salary_min, 'salaryMax', j.salary_max, 'salaryVisible', j.salary_visible,
        'jobTypeId', j.job_type_id, 'workModeId', j.work_mode_id, 'positionTitle', j.position_title,
        'status', j.status, 'expiresAt', j.expires_at), j.company_user_id
      INTO v_job, v_company_user_id FROM public.jobs j WHERE j.id = p_job_id AND j.deleted_at IS NULL;
    IF v_job IS NULL OR v_company_user_id <> v_me THEN RETURN NULL; END IF;
    SELECT COALESCE(jsonb_agg(s.name ORDER BY s.name), '[]'::jsonb) INTO v_skills
      FROM public.job_skills js JOIN public.skills s ON s.id = js.skill_id WHERE js.job_id = p_job_id;
    RETURN jsonb_build_object('job', v_job, 'skills', v_skills);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_for_edit(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_job(
    p_job_id BIGINT, p_title TEXT, p_description TEXT, p_requirements TEXT,
    p_province_id BIGINT, p_ward_id BIGINT,
    p_salary_min BIGINT, p_salary_max BIGINT, p_salary_visible BOOLEAN,
    p_job_type_id BIGINT, p_work_mode_id BIGINT, p_position_title TEXT,
    p_expires_at TIMESTAMPTZ, p_skills TEXT[]
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_status TEXT; v_company_user_id BIGINT;
    v_old_status TEXT; v_skill_name TEXT; v_skill_id BIGINT; v_position_title TEXT;
BEGIN
    SELECT u.id, u.account_type, u.status INTO v_me, v_role, v_status FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    IF v_status <> 'active' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive'); END IF;
    SELECT j.company_user_id, j.status INTO v_company_user_id, v_old_status
      FROM public.jobs j WHERE j.id = p_job_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status = 'removed' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobRemoved'); END IF;
    IF btrim(COALESCE(p_title, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle'); END IF;
    IF char_length(btrim(p_title)) > 255 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong'); END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription'); END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode'); END IF;
    IF p_province_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince'); END IF;
    v_position_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_position_title IS NOT NULL AND char_length(v_position_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong'); END IF;
    UPDATE public.jobs SET title = btrim(p_title), description = btrim(p_description),
        requirements = NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        province_id = p_province_id, ward_id = p_ward_id,
        salary_min = p_salary_min, salary_max = p_salary_max,
        salary_visible = COALESCE(p_salary_visible, TRUE),
        job_type_id = p_job_type_id, work_mode_id = p_work_mode_id,
        position_title = v_position_title, expires_at = p_expires_at, updated_at = NOW()
     WHERE id = p_job_id;
    DELETE FROM public.job_skills WHERE job_id = p_job_id;
    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;
            SELECT id INTO v_skill_id FROM public.skills WHERE name = v_skill_name LIMIT 1;
            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_skill_id;
            END IF;
            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (p_job_id, v_skill_id, TRUE) ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'jobId', p_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job(
    BIGINT, TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN, BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_jobs_list(
    p_search TEXT DEFAULT NULL, p_province_id BIGINT DEFAULT NULL,
    p_job_type_ids BIGINT[] DEFAULT NULL, p_work_mode_ids BIGINT[] DEFAULT NULL,
    p_salary_min BIGINT DEFAULT NULL, p_company_user_id BIGINT DEFAULT NULL,
    p_limit INT DEFAULT 20, p_offset INT DEFAULT 0
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_items JSONB; v_total INT; v_lim INT; v_off INT; v_q TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');
    WITH base AS (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               j.created_at, j.expires_at, j.company_user_id,
               j.province_id, j.ward_id, j.job_type_id, j.work_mode_id,
               pv.name AS province_name, dt.name AS ward_name,
               jt.name AS job_type_name, wm.name AS work_mode_name,
               COALESCE(cp.name, u.email) AS company_name,
               cp.logo_url AS company_logo_url,
               cp.verification_status AS company_verification_status
          FROM public.jobs j
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE j.status = 'active' AND j.deleted_at IS NULL
           AND (j.expires_at IS NULL OR j.expires_at > NOW())
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
           AND (p_province_id IS NULL OR j.province_id = p_province_id)
           AND (p_job_type_ids IS NULL OR j.job_type_id = ANY(p_job_type_ids))
           AND (p_work_mode_ids IS NULL OR j.work_mode_id = ANY(p_work_mode_ids))
           AND (p_salary_min IS NULL OR COALESCE(j.salary_max, j.salary_min) >= p_salary_min)
           AND (p_company_user_id IS NULL OR j.company_user_id = p_company_user_id)
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (SELECT * FROM base ORDER BY created_at DESC LIMIT v_lim OFFSET v_off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title,
        'salaryMin', p.salary_min, 'salaryMax', p.salary_max, 'salaryVisible', p.salary_visible,
        'createdAt', p.created_at, 'expiresAt', p.expires_at, 'companyUserId', p.company_user_id,
        'companyName', p.company_name, 'companyLogoUrl', p.company_logo_url,
        'companyVerified', p.company_verification_status = 'verified',
        'provinceName', p.province_name, 'wardName', p.ward_name,
        'jobTypeName', p.job_type_name, 'workModeName', p.work_mode_name,
        'viewerSaved', v_me IS NOT NULL AND EXISTS(SELECT 1 FROM public.saved_jobs s WHERE s.user_id = v_me AND s.job_id = p.id),
        'viewerApplied', v_me IS NOT NULL AND EXISTS(SELECT 1 FROM public.job_applications a WHERE a.applicant_id = v_me AND a.job_id = p.id)
    ) ORDER BY p.created_at DESC), '[]'::jsonb), (SELECT total FROM counted)
      INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_jobs_list(
    TEXT, BIGINT, BIGINT[], BIGINT[], BIGINT, BIGINT, INT, INT
) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_to_job(
    p_job_id BIGINT, p_cover_letter TEXT, p_resume_url TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_role TEXT; v_job_status TEXT; v_job_expires TIMESTAMPTZ; v_application_id BIGINT;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
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

CREATE OR REPLACE FUNCTION public.toggle_saved_job(p_job_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_role TEXT; v_existing INT; v_saved BOOLEAN;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'member' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.jobs WHERE id = p_job_id AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    SELECT 1 INTO v_existing FROM public.saved_jobs WHERE user_id = v_me AND job_id = p_job_id LIMIT 1;
    IF v_existing IS NOT NULL THEN DELETE FROM public.saved_jobs WHERE user_id = v_me AND job_id = p_job_id; v_saved := FALSE;
    ELSE INSERT INTO public.saved_jobs(user_id, job_id) VALUES (v_me, p_job_id) ON CONFLICT DO NOTHING; v_saved := TRUE; END IF;
    RETURN jsonb_build_object('ok', TRUE, 'saved', v_saved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_saved_job(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_saved_jobs(p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE v_me BIGINT; v_items JSONB; v_total INT; v_lim INT; v_off INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0); END IF;
    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    WITH base AS (
        SELECT s.created_at AS saved_at, j.id, j.title, j.salary_min, j.salary_max,
               j.salary_visible, j.status, j.created_at AS job_created_at, j.expires_at,
               j.company_user_id, COALESCE(cp.name, u.email) AS company_name,
               cp.logo_url AS company_logo_url, pv.name AS province_name,
               dt.name AS ward_name, jt.name AS job_type_name, wm.name AS work_mode_name
          FROM public.saved_jobs s JOIN public.jobs j ON j.id = s.job_id AND j.deleted_at IS NULL
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE s.user_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (SELECT * FROM base ORDER BY saved_at DESC LIMIT v_lim OFFSET v_off)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'title', p.title,
        'salaryMin', p.salary_min, 'salaryMax', p.salary_max, 'salaryVisible', p.salary_visible,
        'jobStatus', p.status, 'savedAt', p.saved_at, 'createdAt', p.job_created_at,
        'expiresAt', p.expires_at, 'companyUserId', p.company_user_id,
        'companyName', p.company_name, 'companyLogoUrl', p.company_logo_url,
        'provinceName', p.province_name, 'wardName', p.ward_name,
        'jobTypeName', p.job_type_name, 'workModeName', p.work_mode_name
    ) ORDER BY p.saved_at DESC), '[]'::jsonb), (SELECT total FROM counted)
      INTO v_items, v_total FROM page p;
    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_saved_jobs(INT, INT) TO authenticated;

-- =============================================================================
-- 29. RPCs — get_my_applications + schedule_interview + respond_interview + recruitment
-- =============================================================================

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

CREATE OR REPLACE FUNCTION public.schedule_interview(
    p_application_id BIGINT, p_scheduled_at TIMESTAMPTZ,
    p_duration_minutes INT, p_location_or_link TEXT, p_note TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE
    v_me BIGINT; v_company_user_id BIGINT; v_old_status TEXT;
    v_applicant_id BIGINT; v_job_id BIGINT; v_job_title TEXT;
    v_duration INT; v_interview_id BIGINT; v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    SELECT j.company_user_id, a.status, a.applicant_id, j.id, j.title
      INTO v_company_user_id, v_old_status, v_applicant_id, v_job_id, v_job_title
      FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = p_application_id AND j.deleted_at IS NULL LIMIT 1;
    IF v_company_user_id IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound'); END IF;
    IF v_company_user_id <> v_me THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner'); END IF;
    IF v_old_status IN ('hired', 'rejected', 'withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotSchedule'); END IF;
    IF p_scheduled_at IS NULL OR p_scheduled_at <= v_now THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidScheduleTime'); END IF;
    v_duration := COALESCE(p_duration_minutes, 60);
    IF v_duration < 15 OR v_duration > 480 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDuration'); END IF;
    DELETE FROM public.interview_schedules WHERE application_id = p_application_id;
    INSERT INTO public.interview_schedules(application_id, scheduled_at, duration_minutes,
        location_or_link, note, created_by, status)
    VALUES (p_application_id, p_scheduled_at, v_duration,
        NULLIF(btrim(COALESCE(p_location_or_link, '')), ''),
        NULLIF(btrim(COALESCE(p_note, '')), ''), v_me, 'scheduled')
    RETURNING id INTO v_interview_id;
    IF v_old_status <> 'interview' THEN
        UPDATE public.job_applications SET status = 'interview', updated_at = v_now WHERE id = p_application_id;
        INSERT INTO public.application_status_history(application_id, old_status, new_status, changed_by, note, changed_at)
        VALUES (p_application_id, v_old_status, 'interview', v_me, NULL, v_now);
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'interviewId', v_interview_id,
        'applicationId', p_application_id, 'applicantId', v_applicant_id,
        'jobId', v_job_id, 'jobTitle', v_job_title, 'scheduledAt', p_scheduled_at,
        'statusChanged', v_old_status <> 'interview');
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_interview(
    BIGINT, TIMESTAMPTZ, INT, TEXT, TEXT
) TO authenticated;

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

CREATE OR REPLACE FUNCTION public.resubmit_company_verification()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_role TEXT; v_status TEXT;
BEGIN
    SELECT u.id, u.account_type INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_role <> 'company' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany'); END IF;
    SELECT verification_status INTO v_status FROM public.company_profiles
     WHERE user_id = v_me AND deleted_at IS NULL LIMIT 1;
    IF v_status IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound'); END IF;
    IF v_status NOT IN ('rejected', 'pending_update') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notResubmittable'); END IF;
    UPDATE public.company_profiles SET verification_status = 'pending',
        verification_note = NULL, verified_by = NULL, verified_at = NULL, updated_at = NOW()
     WHERE user_id = v_me;
    RETURN jsonb_build_object('ok', TRUE, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubmit_company_verification() TO authenticated;

CREATE OR REPLACE FUNCTION public.log_job_view(p_job_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public VOLATILE AS $$
DECLARE v_me BIGINT; v_owner BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT company_user_id INTO v_owner FROM public.jobs
     WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;
    IF v_owner IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound'); END IF;
    IF v_me IS NOT NULL AND v_me = v_owner THEN RETURN jsonb_build_object('ok', TRUE, 'logged', FALSE); END IF;
    IF v_me IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.job_view_logs
         WHERE job_id = p_job_id AND viewer_user_id = v_me AND viewed_at > NOW() - INTERVAL '6 hours'
    ) THEN RETURN jsonb_build_object('ok', TRUE, 'logged', FALSE); END IF;
    INSERT INTO public.job_view_logs(job_id, viewer_user_id) VALUES (p_job_id, v_me);
    RETURN jsonb_build_object('ok', TRUE, 'logged', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_job_view(BIGINT) TO authenticated;

-- =============================================================================
-- 30. RPCs — get_user_posts
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_posts(
    p_target_user_id BIGINT, p_posts_cursor TIMESTAMPTZ DEFAULT NULL, p_posts_limit INT DEFAULT 10
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE
    v_me BIGINT; v_is_owner BOOLEAN := FALSE; v_is_connected BOOLEAN := FALSE;
    v_is_admin BOOLEAN := FALSE; v_can_view BOOLEAN := TRUE;
    v_target_role VARCHAR(20); v_visibility VARCHAR(20); v_posts JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    SELECT u.account_type INTO v_target_role FROM public.users u
     WHERE u.id = p_target_user_id AND u.deleted_at IS NULL LIMIT 1;
    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('posts', '[]'::jsonb, 'next_cursor', NULL, 'can_view', FALSE); END IF;
    v_is_owner := (v_me IS NOT NULL AND v_me = p_target_user_id);
    v_is_admin := public.is_admin();
    IF v_target_role = 'member' THEN
        SELECT mp.profile_visibility INTO v_visibility FROM public.member_profiles mp
         WHERE mp.user_id = p_target_user_id AND mp.deleted_at IS NULL LIMIT 1;
        IF v_visibility = 'private' AND NOT (v_is_owner OR v_is_admin) THEN
            v_can_view := FALSE;
        ELSIF v_visibility = 'connections' AND NOT (v_is_owner OR v_is_admin) THEN
            IF v_me IS NULL THEN
                v_can_view := FALSE;
            ELSE
                SELECT EXISTS(SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
                    AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
                      OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))) INTO v_is_connected;
                IF NOT v_is_connected THEN v_can_view := FALSE; END IF;
            END IF;
        END IF;
    END IF;
    IF NOT v_can_view THEN
        RETURN jsonb_build_object('posts', '[]'::jsonb, 'next_cursor', NULL, 'can_view', FALSE); END IF;
    IF v_me IS NOT NULL AND NOT v_is_owner THEN
        SELECT EXISTS(SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
            AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
              OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))) INTO v_is_connected;
    END IF;
    WITH feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at, p.reaction_count, p.comment_count, p.share_count
          FROM public.posts p
         WHERE p.author_id = p_target_user_id AND p.deleted_at IS NULL AND p.status = 'active'
           AND (v_is_admin OR v_is_owner OR p.visibility = 'public'
             OR (p.visibility = 'connections' AND v_is_connected))
           AND (p_posts_cursor IS NULL OR p.created_at < p_posts_cursor)
         ORDER BY p.created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.ord), '[]'::jsonb) INTO v_posts
      FROM (SELECT row_number() OVER (ORDER BY f.created_at DESC) AS ord,
                   f.id, f.author_id AS "authorId", f.content, f.post_type AS "postType",
                   f.media, f.visibility, f.created_at AS "createdAt",
                   jsonb_build_object('userId', f.author_id, 'role', au.account_type,
                       'displayName', COALESCE(amp.full_name, acp.name),
                       'avatarUrl', COALESCE(amp.avatar_url, acp.logo_url),
                       'headline', COALESCE(amp.headline, acp.industry)) AS author,
                   f.reaction_count AS "reactionCount", f.comment_count AS "commentCount",
                   f.share_count AS "shareCount",
                   CASE WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS(SELECT 1 FROM public.post_reactions r WHERE r.post_id = f.id AND r.user_id = v_me)
                   END AS "viewerReacted",
                   CASE WHEN f.post_type = 'poll' THEN (
                       SELECT COALESCE(jsonb_agg(jsonb_build_object('id', po.id, 'optionText', po.option_text,
                           'voteCount', po.vote_count, 'viewerVoted', CASE WHEN v_me IS NULL THEN FALSE
                               ELSE EXISTS(SELECT 1 FROM public.poll_votes pv WHERE pv.option_id = po.id AND pv.user_id = v_me)
                           END) ORDER BY po.id), '[]'::jsonb)
                       FROM public.poll_options po WHERE po.post_id = f.id)
                   ELSE NULL END AS "pollOptions"
              FROM feed f
              JOIN public.users au ON au.id = f.author_id
              LEFT JOIN public.member_profiles amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
              LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
        ) x;
    RETURN jsonb_build_object('posts', v_posts, 'next_cursor',
        (SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
          WHERE jsonb_array_length(v_posts) = p_posts_limit), 'can_view', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_posts(BIGINT, TIMESTAMPTZ, INT) TO anon, authenticated;

-- =============================================================================
-- 31. RPCs — Messaging
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_messaging_overview(p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_me BIGINT; v_items JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0); END IF;
    WITH my_conv AS (
        SELECT cp.conversation_id, cp.last_read_at, cp.unread_count
          FROM public.conversation_participants cp WHERE cp.user_id = v_me
    ),
    other_part AS (
        SELECT mc.conversation_id, cp.user_id AS other_user_id, mc.unread_count
          FROM my_conv mc JOIN public.conversation_participants cp
            ON cp.conversation_id = mc.conversation_id AND cp.user_id <> v_me
    ),
    convo_rows AS (
        SELECT c.id AS "conversationId", c.updated_at AS "updatedAt", c.seq AS "seq",
               op.other_user_id AS "otherUserId",
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline", u.account_type AS role,
               c.last_message_id AS "lastMessageId", c.last_sender_id AS "lastSenderId",
               c.last_content AS "lastContent", NULL::JSONB AS "lastMedia",
               c.last_message_created_at AS "lastCreatedAt",
               op.unread_count AS "unreadCount",
               TRUE AS "isConnected",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = v_me AND ub.blocked_id = op.other_user_id) AS "blockedByMe",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = op.other_user_id AND ub.blocked_id = v_me) AS "blockedMe",
               COALESCE(c.last_message_created_at, c.updated_at) AS sort_key
          FROM other_part op
          JOIN public.conversations c ON c.id = op.conversation_id
          JOIN public.users u ON u.id = op.other_user_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = op.other_user_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = op.other_user_id AND cp.deleted_at IS NULL
    ),
    my_connections AS (
        SELECT CASE WHEN cn.requester_id = v_me THEN cn.receiver_id ELSE cn.requester_id END AS other_id,
               COALESCE(cn.responded_at, cn.requested_at) AS connected_at
          FROM public.connections cn
         WHERE cn.status = 'accepted' AND (cn.requester_id = v_me OR cn.receiver_id = v_me)
    ),
    connections_without_convo AS (
        SELECT mc.other_id, mc.connected_at FROM my_connections mc
         WHERE mc.other_id NOT IN (SELECT "otherUserId" FROM convo_rows)
    ),
    placeholder_rows AS (
        SELECT NULL::BIGINT AS "conversationId", cwc.connected_at AS "updatedAt", NULL::INT AS "seq",
               cwc.other_id AS "otherUserId",
               COALESCE(mp.full_name, cp.name) AS "displayName",
               COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
               COALESCE(mp.headline, cp.industry) AS "headline", u.account_type AS role,
               NULL::BIGINT AS "lastMessageId", NULL::BIGINT AS "lastSenderId",
               NULL::TEXT AS "lastContent", NULL::JSONB AS "lastMedia",
               NULL::TIMESTAMPTZ AS "lastCreatedAt", 0::INT AS "unreadCount",
               TRUE AS "isConnected",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = v_me AND ub.blocked_id = cwc.other_id) AS "blockedByMe",
               EXISTS(SELECT 1 FROM public.user_blocks ub
                      WHERE ub.blocker_id = cwc.other_id AND ub.blocked_id = v_me) AS "blockedMe",
               cwc.connected_at AS sort_key
          FROM connections_without_convo cwc
          JOIN public.users u ON u.id = cwc.other_id
          LEFT JOIN public.member_profiles mp ON mp.user_id = cwc.other_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp ON cp.user_id = cwc.other_id AND cp.deleted_at IS NULL
         WHERE u.deleted_at IS NULL
    )
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'conversationId', ar."conversationId", 'updatedAt', ar."updatedAt", 'seq', ar."seq",
        'otherUserId', ar."otherUserId", 'displayName', ar."displayName",
        'avatarUrl', ar."avatarUrl", 'headline', ar."headline", 'role', ar.role,
        'lastMessageId', ar."lastMessageId", 'lastSenderId', ar."lastSenderId",
        'lastContent', ar."lastContent", 'lastMedia', ar."lastMedia",
        'lastCreatedAt', ar."lastCreatedAt", 'unreadCount', ar."unreadCount",
        'isConnected', ar."isConnected", 'blockedByMe', ar."blockedByMe",
        'blockedMe', ar."blockedMe"
    ) ORDER BY ar.sort_key DESC NULLS LAST), '[]'::jsonb) INTO v_items
      FROM (
          SELECT * FROM convo_rows UNION ALL SELECT * FROM placeholder_rows
          ORDER BY sort_key DESC NULLS LAST LIMIT p_limit
      ) ar;
    SELECT COUNT(*)::INT INTO v_unread_total
      FROM public.conversation_participants cp
     WHERE cp.user_id = v_me AND cp.unread_count > 0;
    RETURN jsonb_build_object('items', v_items, 'unreadConversations', v_unread_total);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_messaging_overview(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_unread_conversations_count()
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE v_me BIGINT; v_count INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN 0; END IF;
    SELECT COUNT(*)::INT INTO v_count
      FROM public.conversation_participants cp
     WHERE cp.user_id = v_me AND cp.unread_count > 0;
    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_conversations_count() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_conversation_messages(
    p_conversation_id BIGINT, p_before_created_at TIMESTAMPTZ DEFAULT NULL,
    p_before_id BIGINT DEFAULT NULL, p_limit INT DEFAULT 40
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_is_participant BOOLEAN; v_other_user_id BIGINT;
    v_items JSONB; v_has_more BOOLEAN; v_limit INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'hasMore', FALSE, 'otherUserId', NULL); END IF;
    SELECT EXISTS(SELECT 1 FROM public.conversation_participants
     WHERE conversation_id = p_conversation_id AND user_id = v_me) INTO v_is_participant;
    IF NOT v_is_participant THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'hasMore', FALSE, 'otherUserId', NULL); END IF;
    SELECT cp.user_id INTO v_other_user_id FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me LIMIT 1;
    v_limit := GREATEST(LEAST(COALESCE(p_limit, 40), 100), 1);
    WITH page AS (
        SELECT m.id, m.sender_id, m.content, m.media, m.read_at, m.created_at
          FROM public.messages m
         WHERE m.conversation_id = p_conversation_id AND m.deleted_at IS NULL
           AND (p_before_created_at IS NULL OR m.created_at < p_before_created_at
             OR (m.created_at = p_before_created_at AND m.id < COALESCE(p_before_id, 9223372036854775807)))
         ORDER BY m.created_at DESC, m.id DESC LIMIT v_limit + 1
    ),
    sliced AS (SELECT * FROM page LIMIT v_limit)
    SELECT COALESCE(jsonb_agg(jsonb_build_object('id', s.id, 'senderId', s.sender_id,
        'content', s.content, 'media', s.media, 'readAt', s.read_at, 'createdAt', s.created_at)
        ORDER BY s.created_at ASC, s.id ASC), '[]'::jsonb),
        (SELECT COUNT(*) FROM page) > v_limit INTO v_items, v_has_more FROM sliced s;
    RETURN jsonb_build_object('items', v_items, 'hasMore', COALESCE(v_has_more, FALSE),
        'otherUserId', v_other_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_messages(BIGINT, TIMESTAMPTZ, BIGINT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(p_other_user_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public AS $$
DECLARE v_me BIGINT; v_conv_id BIGINT; v_ok BOOLEAN; v_blocked BOOLEAN;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF v_me = p_other_user_id THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotMessageSelf'); END IF;
    SELECT EXISTS(SELECT 1 FROM public.connections cn WHERE cn.status = 'accepted'
        AND ((cn.requester_id = v_me AND cn.receiver_id = p_other_user_id)
          OR (cn.requester_id = p_other_user_id AND cn.receiver_id = v_me))) INTO v_ok;
    IF NOT v_ok THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected'); END IF;
    SELECT EXISTS(SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = v_me AND ub.blocked_id = p_other_user_id)
           OR (ub.blocker_id = p_other_user_id AND ub.blocked_id = v_me)) INTO v_blocked;
    IF v_blocked THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked'); END IF;
    SELECT c.id INTO v_conv_id FROM public.conversations c WHERE c.type = 'direct'
       AND EXISTS(SELECT 1 FROM public.conversation_participants cp1
                   WHERE cp1.conversation_id = c.id AND cp1.user_id = v_me)
       AND EXISTS(SELECT 1 FROM public.conversation_participants cp2
                   WHERE cp2.conversation_id = c.id AND cp2.user_id = p_other_user_id)
       AND (SELECT COUNT(*) FROM public.conversation_participants cp3
             WHERE cp3.conversation_id = c.id) = 2 LIMIT 1;
    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations(type) VALUES ('direct') RETURNING id INTO v_conv_id;
        INSERT INTO public.conversation_participants(conversation_id, user_id)
        VALUES (v_conv_id, v_me), (v_conv_id, p_other_user_id);
    END IF;
    RETURN jsonb_build_object('ok', TRUE, 'conversationId', v_conv_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_or_create_direct_conversation(BIGINT) TO authenticated;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id BIGINT, p_content TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public AS $$
DECLARE
    v_me BIGINT; v_other BIGINT; v_ok BOOLEAN; v_blocked BOOLEAN;
    v_recent INT; v_new_id BIGINT; v_created_at TIMESTAMPTZ; v_trim TEXT;
BEGIN
    v_trim := btrim(COALESCE(p_content, ''));
    IF v_trim = '' THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent'); END IF;
    IF char_length(v_trim) > 4000 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'tooLong'); END IF;
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    IF NOT EXISTS(SELECT 1 FROM public.conversation_participants
                   WHERE conversation_id = p_conversation_id AND user_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant'); END IF;
    SELECT cp.user_id INTO v_other FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me LIMIT 1;
    SELECT EXISTS(SELECT 1 FROM public.connections cn WHERE cn.status = 'accepted'
        AND ((cn.requester_id = v_me AND cn.receiver_id = v_other)
          OR (cn.requester_id = v_other AND cn.receiver_id = v_me))) INTO v_ok;
    IF NOT v_ok THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected'); END IF;
    SELECT EXISTS(SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = v_me AND ub.blocked_id = v_other)
           OR (ub.blocker_id = v_other AND ub.blocked_id = v_me)) INTO v_blocked;
    IF v_blocked THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked'); END IF;
    SELECT COUNT(*)::INT INTO v_recent FROM public.messages m
     WHERE m.sender_id = v_me AND m.created_at >= NOW() - INTERVAL '1 minute';
    IF v_recent >= 60 THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'rateLimited'); END IF;
    INSERT INTO public.messages(conversation_id, sender_id, receiver_id, content)
    VALUES (p_conversation_id, v_me, v_other, v_trim) RETURNING id, created_at INTO v_new_id, v_created_at;
    
    UPDATE public.conversations
       SET updated_at = v_created_at,
           last_message_id = v_new_id,
           last_sender_id = v_me,
           last_content = v_trim,
           last_message_created_at = v_created_at,
           seq = seq + 1
     WHERE id = p_conversation_id;

    UPDATE public.conversation_participants
       SET last_read_at = v_created_at
     WHERE conversation_id = p_conversation_id AND user_id = v_me;

    UPDATE public.conversation_participants
       SET unread_count = unread_count + 1
     WHERE conversation_id = p_conversation_id AND user_id = v_other;

    RETURN jsonb_build_object('ok', TRUE, 'message', jsonb_build_object(
        'id', v_new_id, 'senderId', v_me, 'content', v_trim, 'media', NULL,
        'readAt', NULL, 'createdAt', v_created_at), 'recipientId', v_other);
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(BIGINT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public AS $$
DECLARE v_me BIGINT; v_is_participant BOOLEAN;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized'); END IF;
    SELECT EXISTS(SELECT 1 FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id = v_me) INTO v_is_participant;
    IF NOT v_is_participant THEN RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant'); END IF;
    UPDATE public.conversation_participants SET last_read_at = NOW()
     WHERE conversation_id = p_conversation_id AND user_id = v_me;
    UPDATE public.messages SET read_at = NOW()
     WHERE conversation_id = p_conversation_id AND sender_id <> v_me AND read_at IS NULL AND deleted_at IS NULL;
    RETURN jsonb_build_object('ok', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(BIGINT) TO authenticated;

-- =============================================================================
-- #7: share_post RPC — Transaction atomic (INSERT post + INSERT share)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.share_post(
  p_content TEXT,
  p_original_post_id BIGINT,
  p_comment_text TEXT DEFAULT NULL,
  p_media JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id BIGINT;
  v_new_post_id BIGINT;
  v_share_id BIGINT;
BEGIN
  SELECT id INTO v_author_id FROM public.users
   WHERE auth_id = auth.uid() AND deleted_at IS NULL;

  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.posts
     WHERE id = p_original_post_id AND deleted_at IS NULL AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalidPost');
  END IF;

  INSERT INTO public.posts (author_id, content, post_type, media, visibility)
  VALUES (v_author_id, COALESCE(p_content, ''), 'text', p_media, 'public')
  RETURNING id INTO v_new_post_id;

  INSERT INTO public.post_shares (post_id, user_id, comment_content)
  VALUES (p_original_post_id, v_author_id, p_comment_text)
  RETURNING id INTO v_share_id;

  RETURN jsonb_build_object(
    'ok', true,
    'postId', v_new_post_id,
    'shareId', v_share_id,
    'authorId', v_author_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.share_post(TEXT, BIGINT, TEXT, JSONB) TO authenticated;

-- =============================================================================
-- #8: Rate Limiting RPCs
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id BIGINT,
  p_action_type TEXT,
  p_max_requests INT DEFAULT 10,
  p_window_seconds INT DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  DELETE FROM public.rate_limits
   WHERE user_id = p_user_id
     AND action_type = p_action_type
     AND created_at < NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  SELECT COUNT(*) INTO v_count
    FROM public.rate_limits
   WHERE user_id = p_user_id
     AND action_type = p_action_type
     AND created_at >= NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  IF v_count < p_max_requests THEN
    INSERT INTO public.rate_limits (user_id, action_type)
    VALUES (p_user_id, p_action_type);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(BIGINT, TEXT, INT, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_rate_limits(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.rate_limits
   WHERE created_at < NOW() - (p_older_than_hours || ' hours')::INTERVAL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits(INT) TO service_role;

-- =============================================================================
-- #9: create_poll_post RPC — Transaction atomic
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_poll_post(
  p_content TEXT,
  p_visibility TEXT DEFAULT 'public',
  p_options JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_id BIGINT;
  v_post_id BIGINT;
  v_option RECORD;
  v_options JSONB := '[]'::JSONB;
  v_total_votes INT := 0;
BEGIN
  SELECT id INTO v_author_id FROM public.users
   WHERE auth_id = auth.uid() AND deleted_at IS NULL;

  IF v_author_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'unauthorized');
  END IF;

  IF jsonb_array_length(p_options) < 2 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalidOptions');
  END IF;

  INSERT INTO public.posts (author_id, content, post_type, visibility)
  VALUES (v_author_id, COALESCE(p_content, ''), 'poll', p_visibility)
  RETURNING id INTO v_post_id;

  FOR v_option IN SELECT value->>0 AS option_text FROM jsonb_array_elements(p_options) AS value
  LOOP
    INSERT INTO public.poll_options (post_id, option_text, vote_count)
    VALUES (v_post_id, v_option.option_text, 0)
    RETURNING id, option_text, vote_count INTO STRICT v_option;

    v_options := v_options || jsonb_build_object(
      'id', v_option.id,
      'optionText', v_option.option_text,
      'voteCount', 0
    );
  END LOOP;

  UPDATE public.posts
  SET media = jsonb_build_object(
    'type', 'poll',
    'options', v_options,
    'totalVotes', v_total_votes
  )
  WHERE id = v_post_id;

  RETURN jsonb_build_object(
    'ok', true,
    'postId', v_post_id,
    'authorId', v_author_id,
    'options', v_options,
    'totalVotes', v_total_votes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_poll_post(TEXT, TEXT, JSONB) TO authenticated;

-- =============================================================================
-- #11: Network Suggestions Refresh RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.refresh_network_suggestions()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refreshed INT := 0;
  v_user RECORD;
BEGIN
  TRUNCATE public.network_suggestions;

  FOR v_user IN
    SELECT id FROM public.users
     WHERE account_type = 'member' AND status = 'active' AND deleted_at IS NULL
  LOOP
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT
      v_user.id,
      candidate.id,
      (
        SELECT COUNT(DISTINCT uc2.to_user_id)
        FROM public.user_connections_view uc1
        JOIN public.user_connections_view uc2
          ON uc1.to_user_id = uc2.to_user_id AND uc2.status = 'accepted'
        WHERE uc1.from_user_id = v_user.id
          AND uc1.status = 'accepted'
          AND uc2.from_user_id = candidate.id
      ) * 10
      +
      (
        SELECT COUNT(DISTINCT ms2.skill_id)
        FROM public.member_skills ms1
        JOIN public.member_skills ms2 ON ms1.skill_id = ms2.skill_id
        WHERE ms1.user_id = v_user.id AND ms2.user_id = candidate.id
      ) * 5
    AS score
    FROM public.users candidate
    WHERE candidate.id <> v_user.id
      AND candidate.account_type = 'member'
      AND candidate.status = 'active'
      AND candidate.deleted_at IS NULL
      AND candidate.id NOT IN (
        SELECT to_user_id FROM public.user_connections_view
         WHERE from_user_id = v_user.id
      )
    ORDER BY score DESC
    LIMIT 20
    ON CONFLICT DO NOTHING;

    v_refreshed := v_refreshed + 1;
  END LOOP;

  RETURN v_refreshed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_network_suggestions() TO service_role;

-- =============================================================================
-- #11: Sync Suggestions on Connection
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_suggestions_on_connection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    DELETE FROM public.network_suggestions
     WHERE (user_id = NEW.requester_id AND suggested_user_id = NEW.receiver_id)
        OR (user_id = NEW.receiver_id AND suggested_user_id = NEW.requester_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_suggestions_on_connection ON public.connections;
CREATE TRIGGER trg_sync_suggestions_on_connection
  AFTER INSERT OR UPDATE OF status ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.sync_suggestions_on_connection();

-- =============================================================================
-- SEED DATA (Dữ liệu mẫu)
-- =============================================================================

-- 1. Job Types
INSERT INTO public.job_types (code, name, name_en, sort_order) VALUES
('full_time', 'Toàn thời gian', 'Full-time', 1),
('part_time', 'Bán thời gian', 'Part-time', 2),
('internship', 'Thực tập', 'Internship', 3),
('freelance', 'Tự do', 'Freelance', 4),
('contract', 'Hợp đồng', 'Contract', 5)
ON CONFLICT (code) DO NOTHING;

-- 2. Work Modes
INSERT INTO public.work_modes (code, name, name_en, sort_order) VALUES
('on_site', 'Tại văn phòng', 'On-site', 1),
('remote', 'Từ xa', 'Remote', 2),
('hybrid', 'Linh hoạt', 'Hybrid', 3)
ON CONFLICT (code) DO NOTHING;

-- 3. Job Positions
INSERT INTO public.job_positions (code, name, name_en, sort_order) VALUES
('intern', 'Thực tập sinh', 'Intern', 1),
('fresher', 'Mới tốt nghiệp', 'Fresher', 2),
('junior', 'Sơ cấp', 'Junior', 3),
('middle', 'Trung cấp', 'Middle', 4),
('senior', 'Cao cấp', 'Senior', 5),
('lead', 'Trưởng nhóm', 'Lead', 6),
('manager', 'Quản lý', 'Manager', 7),
('director', 'Giám đốc', 'Director', 8)
ON CONFLICT (code) DO NOTHING;



-- =============================================================================
-- RBAC System — Role-Based Access Control
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    description TEXT NULL,
    is_system   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ NULL,
    CONSTRAINT uk_roles_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.modules (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL,
    label       VARCHAR(100) NOT NULL,
    sort_order  INT NOT NULL DEFAULT 0,
    CONSTRAINT uk_modules_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.actions (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL,
    label   VARCHAR(100) NOT NULL,
    CONSTRAINT uk_actions_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id        SERIAL PRIMARY KEY,
    module_id INT NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    action_id INT NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
    name      VARCHAR(100) NOT NULL,
    label     VARCHAR(200) NOT NULL,
    CONSTRAINT uk_permissions_name UNIQUE (name),
    CONSTRAINT uk_permissions_module_action UNIQUE (module_id, action_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id       INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_deleted    ON public.roles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_name       ON public.roles(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rp_role          ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rp_permission    ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_mod  ON public.permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id INT NULL REFERENCES public.roles(id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id) WHERE deleted_at IS NULL;

INSERT INTO public.modules (name, label, sort_order) VALUES
('dashboard', 'Bảng điều khiển', 1),
('users', 'Quản lý người dùng', 2),
('companies', 'Quản lý công ty', 3),
('jobs', 'Quản lý việc làm', 4),
('posts', 'Quản lý bài viết', 5),
('reports', 'Quản lý báo cáo', 6),
('appeals', 'Quản lý kháng nghị', 7),
('audit', 'Nhật ký hoạt động', 8),
('contacts', 'Liên hệ hỗ trợ', 9),
('brand', 'Thương hiệu', 10),
('report_types', 'Loại báo cáo', 11),
('lookups', 'Danh mục', 12),
('settings', 'Cài đặt hệ thống', 13),
('roles', 'Quản lý quyền', 14)
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

INSERT INTO public.actions (name, label) VALUES
('view', 'Xem'),
('create', 'Tạo mới'),
('edit', 'Chỉnh sửa'),
('delete', 'Xóa'),
('export', 'Xuất dữ liệu'),
('suspend', 'Khóa tài khoản'),
('ban', 'Cấm'),
('restore', 'Khôi phục'),
('moderate', 'Duyệt / Kiểm duyệt'),
('status', 'Đổi trạng thái'),
('reply', 'Trả lời'),
('maintenance', 'Bật/tắt bảo trì')
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label;

WITH permission_pairs(module_name, action_names) AS (
  VALUES
    ('dashboard', ARRAY['view']),
    ('users', ARRAY['view','create','edit','delete','export','suspend','ban','restore']),
    ('companies', ARRAY['view','edit','suspend','moderate','restore']),
    ('jobs', ARRAY['view','moderate','delete']),
    ('posts', ARRAY['view','moderate','delete']),
    ('reports', ARRAY['view','moderate','status']),
    ('appeals', ARRAY['view','moderate']),
    ('audit', ARRAY['view']),
    ('contacts', ARRAY['view','reply']),
    ('brand', ARRAY['view','edit']),
    ('report_types', ARRAY['view','create','edit','delete']),
    ('lookups', ARRAY['view','create','edit','delete']),
    ('settings', ARRAY['view','edit','maintenance']),
    ('roles', ARRAY['view','create','edit','delete'])
),
expanded AS (
  SELECT pp.module_name, unnest(pp.action_names) AS action_name
  FROM permission_pairs pp
)
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, m.name || '.' || a.name, m.label || ' - ' || a.label
FROM expanded e
JOIN public.modules m ON m.name = e.module_name
JOIN public.actions a ON a.name = e.action_name
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label;

INSERT INTO public.roles (name, description, is_system) VALUES
('admin', 'Quản trị viên toàn quyền', TRUE),
('member', 'Thành viên thường', TRUE),
('company', 'Nhà tuyển dụng', TRUE),
('content_moderator', 'Người duyệt nội dung', FALSE),
('user_manager', 'Quản lý người dùng', FALSE),
('support_agent', 'Hỗ trợ khách hàng', FALSE)
ON CONFLICT (name) DO NOTHING;

DELETE FROM public.role_permissions WHERE role_id IN (
  SELECT id FROM public.roles
  WHERE name IN ('admin', 'member', 'company', 'content_moderator', 'user_manager', 'support_agent')
);

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'content_moderator'
  AND (p.name = 'dashboard.view' OR p.name LIKE 'posts.%' OR p.name LIKE 'reports.%' OR p.name LIKE 'appeals.%' OR p.name LIKE 'audit.%')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'user_manager'
  AND (p.name = 'dashboard.view' OR p.name LIKE 'users.%' OR p.name LIKE 'companies.%' OR p.name LIKE 'audit.%')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'support_agent'
  AND (p.name = 'dashboard.view' OR p.name LIKE 'contacts.%' OR p.name = 'reports.view' OR p.name = 'audit.view')
ON CONFLICT DO NOTHING;

UPDATE public.users u
SET role_id = r.id
FROM public.roles r
WHERE u.account_type = r.name AND u.role_id IS NULL;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      LEFT JOIN public.roles r
        ON r.id = u.role_id
       AND r.deleted_at IS NULL
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
       AND (u.account_type = 'admin' OR r.name = 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
  p_user_id BIGINT,
  p_permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      LEFT JOIN public.roles r
        ON r.id = u.role_id
       AND r.deleted_at IS NULL
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND (u.account_type = 'admin' OR r.name = 'admin')
  )
  OR EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.role_permissions rp ON rp.role_id = u.role_id
      JOIN public.permissions p ON p.id = rp.permission_id
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND p.name = p_permission_name
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_permission(p_permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_permission(public.auth_user_id(), p_permission_name);
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id BIGINT)
RETURNS TABLE(permission_name TEXT, module_name TEXT, action_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    JOIN public.role_permissions rp ON rp.role_id = u.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
  UNION
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    CROSS JOIN public.permissions p
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
    LEFT JOIN public.roles r
      ON r.id = u.role_id
     AND r.deleted_at IS NULL
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
     AND (u.account_type = 'admin' OR r.name = 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(BIGINT) TO anon, authenticated;

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_admin_all" ON public.roles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "modules_authenticated_read" ON public.modules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "actions_authenticated_read" ON public.actions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "permissions_authenticated_read" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "role_permissions_admin_all" ON public.role_permissions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.actions TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.actions TO service_role;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.role_permissions TO service_role;

-- =============================================================================
-- 42. DYNAMIC RBAC UNIFICATION — app + admin permissions
-- =============================================================================

INSERT INTO public.modules (name, label, sort_order) VALUES
('admin', 'Khu quản trị', 0),
('dashboard', 'Bảng điều khiển', 1),
('feed', 'Bảng tin', 2),
('network', 'Mạng lưới', 3),
('messages', 'Tin nhắn', 4),
('notifications', 'Thông báo', 5),
('profile', 'Hồ sơ', 6),
('cvs', 'CV', 7),
('users', 'Quản lý người dùng', 8),
('companies', 'Quản lý công ty', 9),
('jobs', 'Quản lý việc làm', 10),
('posts', 'Quản lý bài viết', 11),
('reports', 'Quản lý báo cáo', 12),
('appeals', 'Quản lý kháng nghị', 13),
('audit', 'Nhật ký hoạt động', 14),
('contacts', 'Liên hệ hỗ trợ', 15),
('search', 'Tìm kiếm', 16),
('brand', 'Thương hiệu', 17),
('report_types', 'Loại báo cáo', 18),
('lookups', 'Danh mục', 19),
('settings', 'Cài đặt hệ thống', 20),
('roles', 'Quản lý quyền', 21)
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.actions (name, label) VALUES
('access', 'Truy cập'),
('view', 'Xem'),
('create', 'Tạo mới'),
('edit', 'Chỉnh sửa'),
('delete', 'Xóa'),
('export', 'Xuất dữ liệu'),
('suspend', 'Khóa tài khoản'),
('ban', 'Cấm'),
('restore', 'Khôi phục'),
('moderate', 'Duyệt / Kiểm duyệt'),
('status', 'Đổi trạng thái'),
('reply', 'Trả lời'),
('maintenance', 'Bật/tắt bảo trì'),
('apply', 'Ứng tuyển'),
('save', 'Lưu'),
('send', 'Gửi'),
('follow', 'Theo dõi'),
('connect', 'Kết nối'),
('block', 'Chặn'),
('react', 'Tương tác'),
('comment', 'Bình luận'),
('share', 'Chia sẻ'),
('vote', 'Bình chọn')
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label;

WITH permission_pairs(module_name, action_names) AS (
  VALUES
    ('admin', ARRAY['access']),
    ('dashboard', ARRAY['view']),
    ('feed', ARRAY['view']),
    ('search', ARRAY['view']),
    ('network', ARRAY['view','follow','connect','block']),
    ('messages', ARRAY['view','send']),
    ('notifications', ARRAY['view','edit']),
    ('profile', ARRAY['view','edit']),
    ('cvs', ARRAY['view','create','edit','delete']),
    ('users', ARRAY['view','create','edit','delete','export','suspend','ban','restore']),
    ('companies', ARRAY['view','follow','edit','suspend','moderate','restore']),
    ('jobs', ARRAY['view','create','edit','apply','save','moderate','delete']),
    ('posts', ARRAY['view','create','edit','comment','react','share','vote','moderate','delete']),
    ('reports', ARRAY['create','view','moderate','status']),
    ('appeals', ARRAY['view','create','moderate']),
    ('audit', ARRAY['view']),
    ('contacts', ARRAY['create','view','reply']),
    ('brand', ARRAY['view','edit']),
    ('report_types', ARRAY['view','create','edit','delete']),
    ('lookups', ARRAY['view','create','edit','delete']),
    ('settings', ARRAY['view','edit','maintenance']),
    ('roles', ARRAY['view','create','edit','delete'])
),
expanded AS (
  SELECT pp.module_name, unnest(pp.action_names) AS action_name
  FROM permission_pairs pp
)
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, m.name || '.' || a.name, m.label || ' - ' || a.label
FROM expanded e
JOIN public.modules m ON m.name = e.module_name
JOIN public.actions a ON a.name = e.action_name
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label;

DELETE FROM public.role_permissions WHERE role_id IN (
  SELECT id FROM public.roles
  WHERE name IN ('admin', 'member', 'company', 'content_moderator', 'user_manager', 'support_agent')
);

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

WITH role_permission_seed(role_name, permission_name) AS (
  VALUES
    ('member', 'feed.view'), ('member', 'search.view'),
    ('member', 'network.view'), ('member', 'network.follow'), ('member', 'network.connect'), ('member', 'network.block'),
    ('member', 'messages.view'), ('member', 'messages.send'),
    ('member', 'notifications.view'), ('member', 'notifications.edit'),
    ('member', 'profile.view'), ('member', 'profile.edit'),
    ('member', 'cvs.view'), ('member', 'cvs.create'), ('member', 'cvs.edit'), ('member', 'cvs.delete'),
    ('member', 'companies.view'), ('member', 'companies.follow'),
    ('member', 'jobs.view'), ('member', 'jobs.apply'), ('member', 'jobs.save'),
    ('member', 'posts.view'), ('member', 'posts.create'), ('member', 'posts.edit'), ('member', 'posts.comment'),
    ('member', 'posts.react'), ('member', 'posts.share'), ('member', 'posts.vote'), ('member', 'posts.delete'),
    ('member', 'reports.create'), ('member', 'appeals.view'), ('member', 'appeals.create'),
    ('member', 'contacts.create'), ('member', 'settings.view'), ('member', 'settings.edit'),

    ('company', 'feed.view'), ('company', 'search.view'),
    ('company', 'network.view'), ('company', 'network.follow'), ('company', 'network.connect'), ('company', 'network.block'),
    ('company', 'messages.view'), ('company', 'messages.send'),
    ('company', 'notifications.view'), ('company', 'notifications.edit'),
    ('company', 'profile.view'), ('company', 'profile.edit'),
    ('company', 'companies.view'), ('company', 'companies.follow'), ('company', 'companies.edit'),
    ('company', 'jobs.view'), ('company', 'jobs.create'), ('company', 'jobs.edit'),
    ('company', 'posts.view'), ('company', 'posts.create'), ('company', 'posts.edit'), ('company', 'posts.comment'),
    ('company', 'posts.react'), ('company', 'posts.share'), ('company', 'posts.vote'), ('company', 'posts.delete'),
    ('company', 'reports.create'), ('company', 'appeals.view'), ('company', 'appeals.create'),
    ('company', 'contacts.create'), ('company', 'settings.view'), ('company', 'settings.edit'),

    ('content_moderator', 'admin.access'), ('content_moderator', 'dashboard.view'),
    ('content_moderator', 'posts.view'), ('content_moderator', 'posts.moderate'), ('content_moderator', 'posts.delete'),
    ('content_moderator', 'reports.view'), ('content_moderator', 'reports.moderate'), ('content_moderator', 'reports.status'),
    ('content_moderator', 'appeals.view'), ('content_moderator', 'appeals.moderate'), ('content_moderator', 'audit.view'),

    ('user_manager', 'admin.access'), ('user_manager', 'dashboard.view'),
    ('user_manager', 'users.view'), ('user_manager', 'users.create'), ('user_manager', 'users.edit'),
    ('user_manager', 'users.delete'), ('user_manager', 'users.export'), ('user_manager', 'users.suspend'),
    ('user_manager', 'users.ban'), ('user_manager', 'users.restore'),
    ('user_manager', 'companies.view'), ('user_manager', 'companies.edit'), ('user_manager', 'companies.suspend'),
    ('user_manager', 'companies.moderate'), ('user_manager', 'companies.restore'),
    ('user_manager', 'roles.view'), ('user_manager', 'audit.view'),

    ('support_agent', 'admin.access'), ('support_agent', 'dashboard.view'),
    ('support_agent', 'contacts.view'), ('support_agent', 'contacts.reply'),
    ('support_agent', 'reports.view'), ('support_agent', 'audit.view')
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM role_permission_seed s
JOIN public.roles r ON r.name = s.role_name AND r.deleted_at IS NULL
JOIN public.permissions p ON p.name = s.permission_name
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.roles r
        ON r.id = u.role_id
       AND r.deleted_at IS NULL
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
       AND r.name = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(
  p_user_id BIGINT,
  p_permission_name TEXT
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.roles r
        ON r.id = u.role_id
       AND r.deleted_at IS NULL
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND r.name = 'admin'
  )
  OR EXISTS (
    SELECT 1
      FROM public.users u
      JOIN public.role_permissions rp ON rp.role_id = u.role_id
      JOIN public.permissions p ON p.id = rp.permission_id
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND p.name = p_permission_name
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id BIGINT)
RETURNS TABLE(permission_name TEXT, module_name TEXT, action_name TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    JOIN public.role_permissions rp ON rp.role_id = u.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
  UNION
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    CROSS JOIN public.permissions p
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
    JOIN public.roles r ON r.id = u.role_id AND r.deleted_at IS NULL
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
     AND r.name = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_user_id BIGINT;
  v_account_type TEXT;
  v_role_id INT;
  v_name TEXT;
  v_avatar TEXT;
  v_company_name TEXT;
  v_slug_base TEXT;
BEGIN
  v_account_type := CASE
    WHEN NEW.raw_user_meta_data->>'role' IN ('member', 'company', 'admin')
      THEN NEW.raw_user_meta_data->>'role'
    ELSE 'member'
  END;

  SELECT id INTO v_role_id
    FROM public.roles
   WHERE name = v_account_type
     AND deleted_at IS NULL
   LIMIT 1;

  INSERT INTO public.users (auth_id, email, account_type, role_id, status, email_verified_at)
  VALUES (NEW.id, NEW.email, v_account_type, v_role_id, 'active', COALESCE(NEW.email_confirmed_at, NOW()))
  ON CONFLICT (auth_id) DO UPDATE
     SET email = EXCLUDED.email,
         account_type = COALESCE(public.users.account_type, EXCLUDED.account_type),
         role_id = COALESCE(public.users.role_id, EXCLUDED.role_id),
         email_verified_at = COALESCE(EXCLUDED.email_verified_at, public.users.email_verified_at, NOW()),
         status = CASE
           WHEN public.users.status = 'pending_verification' THEN 'active'
           ELSE public.users.status
         END,
         updated_at = NOW()
  RETURNING id INTO v_new_user_id;

  v_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Thành viên'
  );

  v_avatar := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'picture', '')
  );

  IF v_account_type = 'company' THEN
    v_company_name := COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), v_name, 'Company');
    v_slug_base := COALESCE(
      NULLIF(trim(both '-' FROM regexp_replace(lower(v_company_name), '[^a-z0-9]+', '-', 'g')), ''),
      'company'
    );

    INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
    VALUES (v_new_user_id, v_company_name, v_slug_base || '-' || substring(NEW.id::text, 1, 8), v_avatar)
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_account_type = 'member' THEN
    INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
    VALUES (v_new_user_id, v_name, v_avatar)
    ON CONFLICT (user_id) DO UPDATE
       SET full_name = COALESCE(public.member_profiles.full_name, EXCLUDED.full_name),
           avatar_url = COALESCE(public.member_profiles.avatar_url, EXCLUDED.avatar_url),
           updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(BIGINT) TO anon, authenticated;

-- =============================================================================
-- KẾT THÚC SCHEMA
-- =============================================================================

NOTIFY pgrst, 'reload schema';
