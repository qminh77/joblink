-- =============================================================================
-- JOBLINK DATABASE SCHEMA
-- PostgreSQL / Supabase
-- Charset: UTF8
-- Thiết kế theo SRS Joblink v1.0 (phiên bản đơn giản hoá 19/05/2026)
--
-- Nguyên tắc thiết kế:
--   • 3 vai trò cố định ở cột users.role: 'member' | 'company' | 'admin'
--     (không có bảng roles/permissions/module_settings — phân quyền cố định trong code)
--   • Member và Company là hai loại tài khoản tách biệt (không kế thừa)
--   • Company phải được Admin xác minh trước khi status = 'active'
--   • Admin tạo qua seeder, không tự đăng ký
--   • Chat chỉ giữa hai người dùng đã connected hai chiều (không có InMail)
--   • Open to Work chỉ trên member_profiles; Open to Hire chỉ trên company_profiles
--   • Soft delete dùng deleted_at; audit_logs ghi mọi thay đổi quan trọng
--   • Tất cả FK có ON DELETE phù hợp; index tối ưu cho các truy vấn thường gặp
--   • i18n bằng FILE JSON tại resources/lang/{locale}.json — KHÔNG lưu bản dịch trong DB
--   • Không có gói VIP/subscription/payment/ads/boost — mọi tính năng đều miễn phí
-- =============================================================================

-- Supabase-compatible extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: polymorphic row_to_jsonb (dùng trong RPC home feed)
CREATE OR REPLACE FUNCTION row_to_jsonb(ANYELEMENT)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_jsonb($1);
$$;

-- =============================================================================
-- 1. USERS & AUTH  (M01)
-- =============================================================================
-- Lưu ý: Với Supabase Auth, mật khẩu được quản lý bởi auth.users, KHÔNG lưu trong bảng này.
-- Bảng public.users là bảng public chiếu từ auth.users qua trigger.
CREATE TABLE IF NOT EXISTS users (
    id                BIGSERIAL PRIMARY KEY,
    auth_id           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL,
    role              VARCHAR(20)  NOT NULL,
    status            VARCHAR(30)  NOT NULL DEFAULT 'pending_verification',
    email_verified_at TIMESTAMPTZ NULL,
    phone             VARCHAR(20)  NULL,
    phone_verified_at TIMESTAMPTZ NULL,
    two_fa_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_secret     VARCHAR(255) NULL,
    locale            VARCHAR(10)  NOT NULL DEFAULT 'vi',
    last_login_at     TIMESTAMPTZ NULL,
    remember_token    VARCHAR(100) NULL,
    -- Counter cache duy trì bằng trigger; tránh count(*) trên hot path home feed.
    connection_count   INT NOT NULL DEFAULT 0,
    profile_view_count INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ NULL,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_role   CHECK (role   IN ('member','company','admin')),
    CONSTRAINT chk_users_status CHECK (status IN
        ('pending_verification','active','suspended','banned','deleted'))
);

-- Trigger: tự động tạo public.users khi có user mới từ auth.users
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, role, status, email_verified_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'active' ELSE 'pending_verification' END,
    NEW.email_confirmed_at
  );
  -- Tạo profile tương ứng
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'member') = 'company' THEN
    INSERT INTO public.company_profiles (user_id, name, slug)
    VALUES (
      currval('public.users_id_seq'),
      COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1)),
      COALESCE(
        regexp_replace(
          lower(COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1))),
          '[^a-z0-9]+', '-', 'g'
        ),
        'company'
      ) || '-' || substring(NEW.id::text, 1, 8)
    );
  ELSE
    INSERT INTO public.member_profiles (user_id, full_name)
    VALUES (
      currval('public.users_id_seq'),
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_password_reset_token UNIQUE (token),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_email_verify_token UNIQUE (token),
    CONSTRAINT fk_email_verify_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status      ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_users_active      ON users(role, status) WHERE deleted_at IS NULL;

-- =============================================================================
-- 1.5. LOOKUP CATEGORIES  (M12 — admin quản lý CRUD)
-- Các danh mục dùng cho dropdown/filter ở phía người dùng:
--   • provinces / districts — Tỉnh thành & Quận/Huyện (địa điểm 2 cấp)
--   • job_types             — Loại công việc (fulltime, parttime, internship, ...)
--   • work_modes            — Hình thức làm việc (onsite, remote, hybrid)
--   • job_positions         — Vị trí việc làm (Intern Dev, BA, ...), có cấp cha–con
-- Admin có toàn quyền thêm/sửa/xoá (soft delete). Cờ is_system = TRUE đánh dấu
-- bản ghi gốc do hệ thống seed; UI nên chặn xoá để tránh dữ liệu mồ côi.
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

CREATE TABLE IF NOT EXISTS districts (
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
    CONSTRAINT uk_districts_code UNIQUE (code),
    CONSTRAINT fk_district_province FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
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

CREATE INDEX IF NOT EXISTS idx_provinces_active     ON provinces(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_districts_province   ON districts(province_id)               WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_districts_active     ON districts(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_types_active     ON job_types(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_modes_active    ON work_modes(is_active, sort_order)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_positions_parent ON job_positions(parent_id)             WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_job_positions_active ON job_positions(is_active, sort_order) WHERE deleted_at IS NULL;

-- =============================================================================
-- 2. MEMBER PROFILES  (M02 — role='member')
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
    district_id        BIGINT NULL,
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
    CONSTRAINT fk_member_profile_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
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
    user_id           BIGINT NOT NULL,
    skill_id          BIGINT NOT NULL,
    endorsement_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, skill_id),
    CONSTRAINT fk_member_skill_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    CONSTRAINT fk_member_skill_skill FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_view_logs (
    id             BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT NOT NULL,
    viewer_user_id BIGINT NULL,
    viewed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pvl_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pvl_viewer FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_member_profiles_user     ON member_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_otw      ON member_profiles(open_to_work) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_visibility ON member_profiles(profile_visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_province ON member_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_district ON member_profiles(district_id);
CREATE INDEX IF NOT EXISTS idx_member_experiences_user  ON member_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_member_educations_user   ON member_educations(user_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_user       ON member_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_skill      ON member_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_target      ON profile_view_logs(target_user_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_profile_view_viewer      ON profile_view_logs(viewer_user_id, viewed_at);

-- =============================================================================
-- 3. COMPANY PROFILES  (M02 — role='company')
-- =============================================================================
CREATE TABLE IF NOT EXISTS company_profiles (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT NOT NULL,
    name                   VARCHAR(255) NOT NULL,
    slug                   VARCHAR(255) NOT NULL,
    logo_url               TEXT NULL,
    about                  TEXT NULL,
    website                TEXT NULL,
    province_id            BIGINT NULL,
    district_id            BIGINT NULL,
    industry               VARCHAR(160) NULL,
    size                   VARCHAR(30)  NULL,
    open_to_hire           BOOLEAN NOT NULL DEFAULT FALSE,
    tax_id                 VARCHAR(50)  NULL,
    representative_name    VARCHAR(255) NULL,
    representative_title   VARCHAR(160) NULL,
    business_address       TEXT NULL,
    business_email         VARCHAR(255) NULL,
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
    CONSTRAINT fk_company_profile_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_company_profiles_verification ON company_profiles(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_oth          ON company_profiles(open_to_hire, verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_slug         ON company_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_company_profiles_province     ON company_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_district     ON company_profiles(district_id);

-- =============================================================================
-- 4. POSTS & FEED  (M03)
-- =============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id         BIGSERIAL PRIMARY KEY,
    author_id  BIGINT NOT NULL,
    content    TEXT NOT NULL,
    post_type  VARCHAR(20) NOT NULL DEFAULT 'text',
    media      JSONB NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    status     VARCHAR(20) NOT NULL DEFAULT 'active',
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

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_visibility     ON posts(visibility, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_status         ON posts(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_post_reactions_post  ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post   ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_post      ON poll_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option    ON poll_votes(option_id);

-- =============================================================================
-- 5. NETWORK & CONNECTIONS  (M04)
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

CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver  ON connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_pair      ON connections(requester_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_follows_follower      ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_target        ON follows(followable_type, followable_id);

-- =============================================================================
-- 6. JOBS & RECRUITMENT  (M05)
-- =============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id               BIGSERIAL PRIMARY KEY,
    company_user_id  BIGINT NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT NOT NULL,
    requirements     TEXT NULL,
    province_id      BIGINT NULL,
    district_id      BIGINT NULL,
    salary_min       BIGINT NULL,
    salary_max       BIGINT NULL,
    salary_visible   BOOLEAN NOT NULL DEFAULT TRUE,
    job_type_id      BIGINT NOT NULL,
    work_mode_id     BIGINT NOT NULL,
    job_position_id  BIGINT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'draft',
    expires_at       TIMESTAMPTZ NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ NULL,
    CONSTRAINT chk_job_status CHECK (status IN ('draft','active','closed','expired','removed')),
    CONSTRAINT chk_job_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max),
    CONSTRAINT fk_job_company  FOREIGN KEY (company_user_id) REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT fk_job_province FOREIGN KEY (province_id)     REFERENCES provinces(id)     ON DELETE SET NULL,
    CONSTRAINT fk_job_district FOREIGN KEY (district_id)     REFERENCES districts(id)     ON DELETE SET NULL,
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
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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

CREATE INDEX IF NOT EXISTS idx_jobs_company       ON jobs(company_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status_expire ON jobs(status, expires_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_province      ON jobs(province_id);
CREATE INDEX IF NOT EXISTS idx_jobs_district      ON jobs(district_id);
CREATE INDEX IF NOT EXISTS idx_jobs_type          ON jobs(job_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode     ON jobs(work_mode_id);
CREATE INDEX IF NOT EXISTS idx_jobs_position      ON jobs(job_position_id);
CREATE INDEX IF NOT EXISTS idx_jobs_salary        ON jobs(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_jobs_active_company ON jobs(company_user_id) WHERE deleted_at IS NULL AND status = 'active';

CREATE INDEX IF NOT EXISTS idx_job_skills_job     ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_job_skills_skill   ON job_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_job       ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_applicant ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_status    ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_app_history_app    ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user    ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user    ON job_alerts(user_id, alert_enabled);

-- =============================================================================
-- 7. MESSAGING  (M06)
-- Chỉ chat 1-1; điều kiện: hai user phải có connection 'accepted'
-- =============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(20) NOT NULL DEFAULT 'direct',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_conversation_type CHECK (type IN ('direct'))
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id BIGINT NOT NULL,
    user_id         BIGINT NOT NULL,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ NULL,
    PRIMARY KEY (conversation_id, user_id),
    CONSTRAINT fk_conv_part_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_part_user FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id              BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL,
    sender_id       BIGINT NOT NULL,
    content         TEXT NULL,
    media           JSONB NULL,
    read_at         TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ NULL,
    CONSTRAINT fk_msg_conv   FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE
);

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

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created  ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender        ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker    ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked    ON user_blocks(blocked_id);

-- =============================================================================
-- 8. NOTIFICATIONS  (M07)
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user        ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user          ON notification_preferences(user_id);

-- =============================================================================
-- 9. REPORTS & MODERATION  (M09)
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

CREATE INDEX IF NOT EXISTS idx_reports_status       ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target       ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter     ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_assigned     ON reports(assigned_to);
CREATE INDEX IF NOT EXISTS idx_moderation_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_target    ON moderation_actions(target_type, target_id);

-- =============================================================================
-- 10. AUDIT & SECURITY LOGS  (M09)
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

CREATE TABLE IF NOT EXISTS security_logs (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NULL,
    event_type VARCHAR(80) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    metadata   JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_security_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor     ON audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity    ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action    ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user   ON security_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_event  ON security_logs(event_type, created_at);

-- =============================================================================
-- 11. SYSTEM SETTINGS & IDENTITY  (M12)
-- Đa ngôn ngữ KHÔNG dùng database — đọc trực tiếp từ file JSON lang/{locale}.json
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

CREATE INDEX IF NOT EXISTS idx_system_settings_group ON system_settings(setting_group);

-- =============================================================================
-- 12. TRIGGERS — auto-update updated_at and audit soft delete cho các bảng chính
-- =============================================================================
CREATE OR REPLACE FUNCTION joblink_set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_users() RETURNS trigger AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'users', NEW.id,
           jsonb_build_object('email', OLD.email, 'role', OLD.role, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_posts() RETURNS trigger AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'posts', NEW.id,
           jsonb_build_object('author_id', OLD.author_id, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_jobs() RETURNS trigger AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'jobs', NEW.id,
           jsonb_build_object('company_user_id', OLD.company_user_id, 'title', OLD.title, 'status', OLD.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_company_profiles() RETURNS trigger AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'company_profiles', NEW.id,
           jsonb_build_object('user_id', OLD.user_id, 'name', OLD.name, 'verification_status', OLD.verification_status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_member_profiles_set_updated_at
BEFORE UPDATE ON member_profiles
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_member_experiences_set_updated_at
BEFORE UPDATE ON member_experiences
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_member_educations_set_updated_at
BEFORE UPDATE ON member_educations
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_company_profiles_set_updated_at
BEFORE UPDATE ON company_profiles
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_posts_set_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_post_comments_set_updated_at
BEFORE UPDATE ON post_comments
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_job_applications_set_updated_at
BEFORE UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_interview_schedules_set_updated_at
BEFORE UPDATE ON interview_schedules
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_job_alerts_set_updated_at
BEFORE UPDATE ON job_alerts
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_reports_set_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_system_settings_set_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_provinces_set_updated_at
BEFORE UPDATE ON provinces
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_districts_set_updated_at
BEFORE UPDATE ON districts
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_job_types_set_updated_at
BEFORE UPDATE ON job_types
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_work_modes_set_updated_at
BEFORE UPDATE ON work_modes
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_job_positions_set_updated_at
BEFORE UPDATE ON job_positions
FOR EACH ROW EXECUTE FUNCTION joblink_set_updated_at();

CREATE TRIGGER trg_users_soft_delete
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_users();

CREATE TRIGGER trg_posts_soft_delete
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_posts();

CREATE TRIGGER trg_jobs_soft_delete
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_jobs();

CREATE TRIGGER trg_company_profiles_soft_delete
BEFORE UPDATE ON company_profiles
FOR EACH ROW EXECUTE FUNCTION joblink_audit_soft_delete_company_profiles();

-- =============================================================================
-- 13. VIEWS — query phổ biến
-- =============================================================================
CREATE OR REPLACE VIEW v_active_members AS
SELECT u.id, u.auth_id, u.email, u.role, u.status,
       mp.full_name, mp.avatar_url, mp.headline,
       mp.province_id, p.name AS province_name,
       mp.district_id, d.name AS district_name,
       mp.open_to_work, mp.profile_visibility
FROM users u
JOIN member_profiles mp ON mp.user_id = u.id
LEFT JOIN provinces p ON p.id = mp.province_id
LEFT JOIN districts d ON d.id = mp.district_id
WHERE u.role = 'member'
  AND u.status = 'active'
  AND u.deleted_at IS NULL
  AND mp.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_verified_companies AS
SELECT u.id, u.auth_id, u.email,
       cp.name, cp.slug, cp.logo_url, cp.industry, cp.size,
       cp.province_id, p.name AS province_name,
       cp.district_id, d.name AS district_name,
       cp.open_to_hire, cp.verified_at
FROM users u
JOIN company_profiles cp ON cp.user_id = u.id
LEFT JOIN provinces p ON p.id = cp.province_id
LEFT JOIN districts d ON d.id = cp.district_id
WHERE u.role = 'company'
  AND u.status = 'active'
  AND cp.verification_status = 'verified'
  AND u.deleted_at IS NULL
  AND cp.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_active_jobs AS
SELECT j.*,
       cp.name      AS company_name,
       cp.slug      AS company_slug,
       cp.logo_url  AS company_logo,
       p.name       AS province_name,
       d.name       AS district_name,
       jt.code      AS job_type_code,
       jt.name      AS job_type_name,
       wm.code      AS work_mode_code,
       wm.name      AS work_mode_name,
       jp.name      AS job_position_name
FROM jobs j
JOIN company_profiles cp ON cp.user_id = j.company_user_id
JOIN job_types  jt ON jt.id = j.job_type_id
JOIN work_modes wm ON wm.id = j.work_mode_id
LEFT JOIN provinces     p  ON p.id  = j.province_id
LEFT JOIN districts     d  ON d.id  = j.district_id
LEFT JOIN job_positions jp ON jp.id = j.job_position_id
WHERE j.status = 'active'
  AND (j.expires_at IS NULL OR j.expires_at > NOW())
  AND j.deleted_at IS NULL
  AND cp.verification_status = 'verified';

CREATE OR REPLACE VIEW v_pending_company_verifications AS
SELECT u.id AS user_id, u.email, u.created_at AS registered_at,
       cp.name, cp.tax_id, cp.representative_name,
       cp.business_address, cp.business_email,
       cp.verification_status, cp.verification_documents
FROM users u
JOIN company_profiles cp ON cp.user_id = u.id
WHERE cp.verification_status IN ('pending','pending_update')
  AND u.deleted_at IS NULL
ORDER BY u.created_at ASC;

-- =============================================================================
-- 13b. HOME FEED PERFORMANCE LAYER — counter cache + composite indexes
-- Bao gồm: composite indexes, counter cache triggers, backfill.
-- RPC get_home_feed ở section 14. Tất cả idempotent — chạy lại không lỗi.
-- =============================================================================

-- Composite indexes home feed
CREATE INDEX IF NOT EXISTS idx_connections_req_status_pair
    ON public.connections(requester_id, status, receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_recv_status_pair
    ON public.connections(receiver_id, status, requester_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_target_recent
    ON public.profile_view_logs(target_user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created_active
    ON public.posts(created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_posts_author_created_active
    ON public.posts(author_id, created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user
    ON public.post_reactions(post_id, user_id);

-- Counter cache triggers
CREATE OR REPLACE FUNCTION public.connections_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'accepted' THEN
            UPDATE public.users SET connection_count = connection_count + 1
                WHERE id IN (NEW.requester_id, NEW.receiver_id);
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
                UPDATE public.users SET connection_count = connection_count + 1
                    WHERE id IN (NEW.requester_id, NEW.receiver_id);
            ELSIF OLD.status = 'accepted' AND NEW.status <> 'accepted' THEN
                UPDATE public.users SET connection_count = GREATEST(0, connection_count - 1)
                    WHERE id IN (OLD.requester_id, OLD.receiver_id);
            END IF;
        END IF;
        IF NEW.status = 'accepted' AND OLD.status = 'accepted'
           AND (OLD.requester_id, OLD.receiver_id) IS DISTINCT FROM (NEW.requester_id, NEW.receiver_id) THEN
            UPDATE public.users SET connection_count = GREATEST(0, connection_count - 1)
                WHERE id IN (OLD.requester_id, OLD.receiver_id);
            UPDATE public.users SET connection_count = connection_count + 1
                WHERE id IN (NEW.requester_id, NEW.receiver_id);
        END IF;
        RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'accepted' THEN
            UPDATE public.users SET connection_count = GREATEST(0, connection_count - 1)
                WHERE id IN (OLD.requester_id, OLD.receiver_id);
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_connections_counter ON public.connections;
CREATE TRIGGER trg_connections_counter
    AFTER INSERT OR UPDATE OR DELETE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION public.connections_counter_trigger();

CREATE OR REPLACE FUNCTION public.profile_view_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.users SET profile_view_count = profile_view_count + 1
            WHERE id = NEW.target_user_id;
        RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
        UPDATE public.users SET profile_view_count = GREATEST(0, profile_view_count - 1)
            WHERE id = OLD.target_user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_view_counter ON public.profile_view_logs;
CREATE TRIGGER trg_profile_view_counter
    AFTER INSERT OR DELETE ON public.profile_view_logs
    FOR EACH ROW EXECUTE FUNCTION public.profile_view_counter_trigger();

-- -----------------------------------------------------------------------------
-- Backfill counter một lần (chạy sau seed, ensure dữ liệu khớp)
-- -----------------------------------------------------------------------------
WITH conn_counts AS (
    SELECT u.id,
           (SELECT COUNT(*) FROM public.connections c
              WHERE c.status = 'accepted'
                AND (c.requester_id = u.id OR c.receiver_id = u.id)) AS cnt
    FROM public.users u
),
view_counts AS (
    SELECT u.id,
           (SELECT COUNT(*) FROM public.profile_view_logs v
              WHERE v.target_user_id = u.id) AS cnt
    FROM public.users u
)
UPDATE public.users u
   SET connection_count   = cc.cnt,
       profile_view_count = vc.cnt
  FROM conn_counts cc, view_counts vc
 WHERE cc.id = u.id AND vc.id = u.id
   AND (u.connection_count <> cc.cnt OR u.profile_view_count <> vc.cnt);

-- =============================================================================
-- 14. HOME FEED RPC — get_home_feed
-- Một endpoint duy nhất trả về stats + suggestions + posts (cursor pagination)
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
    v_me             BIGINT;
    v_stats          JSONB;
    v_suggestions    JSONB;
    v_posts          JSONB;
    v_excluded_ids   BIGINT[];
    v_connection_ids BIGINT[];
BEGIN
    -- Lấy app user id hiện tại từ auth context.
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object(
            'stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0),
            'suggestions', '[]'::jsonb,
            'posts', '[]'::jsonb,
            'connection_ids', '[]'::jsonb,
            'me', NULL,
            'next_cursor', NULL
        );
    END IF;

    -- STATS — đọc trực tiếp counter cache (O(1))
    SELECT jsonb_build_object(
        'connection_count', u.connection_count,
        'profile_view_count', u.profile_view_count
    ) INTO v_stats
    FROM public.users u WHERE u.id = v_me;

    -- Tập user ID đã liên quan (để loại khỏi suggestions, và để filter posts)
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

    -- SUGGESTIONS — pick recent active users không thuộc excluded
    WITH candidates AS (
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
            LEFT JOIN public.districts md  ON md.id  = mp.district_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.districts cd  ON cd.id  = cp.district_id
      ) s;

    -- POSTS — của tôi + của connections; visibility = 'public' hoặc 'connections'
    WITH visible_authors AS (
        SELECT unnest(array_prepend(v_me, v_connection_ids)) AS author_id
    ),
    feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at
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
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.ord), '[]'::jsonb)
      INTO v_posts
      FROM (
          SELECT
              row_number() OVER (ORDER BY f.created_at DESC) AS ord,
              f.id,
              f.author_id   AS "authorId",
              f.content,
              f.post_type   AS "postType",
              f.media,
              f.visibility,
              f.created_at  AS "createdAt",
              jsonb_build_object(
                  'userId',      f.author_id,
                  'role',        au.role,
                  'displayName', COALESCE(amp.full_name, acp.name),
                  'avatarUrl',   COALESCE(amp.avatar_url, acp.logo_url),
                  'headline',    COALESCE(amp.headline, acp.industry)
              ) AS author,
              (SELECT COUNT(*) FROM public.post_reactions r WHERE r.post_id = f.id) AS "reactionCount",
              (SELECT COUNT(*) FROM public.post_comments  cm
                WHERE cm.post_id = f.id AND cm.deleted_at IS NULL AND cm.status = 'active') AS "commentCount",
              (SELECT COUNT(*) FROM public.post_shares    sh WHERE sh.post_id = f.id) AS "shareCount",
              EXISTS (
                  SELECT 1 FROM public.post_reactions r
                   WHERE r.post_id = f.id AND r.user_id = v_me
              ) AS "viewerReacted"
            FROM feed f
            JOIN public.users au ON au.id = f.author_id
            LEFT JOIN public.member_profiles  amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
            LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
      ) x;

    RETURN jsonb_build_object(
        'stats',          v_stats,
        'suggestions',    v_suggestions,
        'posts',          v_posts,
        'connection_ids', to_jsonb(v_connection_ids),
        'me',             v_me,
        'next_cursor', (
            SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
            WHERE jsonb_array_length(v_posts) = p_posts_limit
        )
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_home_feed(TIMESTAMPTZ, INT, INT)
    TO authenticated;

-- =============================================================================
-- 14b. USER POSTS RPC — get_user_posts
-- Trả về các bài viết của một user (kèm visibility check) trong 1 round-trip.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_posts(
    p_target_user_id BIGINT,
    p_posts_cursor   TIMESTAMPTZ DEFAULT NULL,
    p_posts_limit    INT         DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me           BIGINT;
    v_is_owner     BOOLEAN := FALSE;
    v_is_connected BOOLEAN := FALSE;
    v_can_view     BOOLEAN := TRUE;
    v_target_role  VARCHAR(20);
    v_visibility   VARCHAR(20);
    v_posts        JSONB;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    SELECT u.role INTO v_target_role
      FROM public.users u
     WHERE u.id = p_target_user_id
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object(
            'posts', '[]'::jsonb,
            'next_cursor', NULL,
            'can_view', FALSE
        );
    END IF;

    v_is_owner := (v_me IS NOT NULL AND v_me = p_target_user_id);

    IF v_target_role = 'member' THEN
        SELECT mp.profile_visibility INTO v_visibility
          FROM public.member_profiles mp
         WHERE mp.user_id = p_target_user_id
           AND mp.deleted_at IS NULL
         LIMIT 1;

        IF v_visibility = 'private' AND NOT v_is_owner THEN
            v_can_view := FALSE;
        END IF;
    END IF;

    IF NOT v_can_view THEN
        RETURN jsonb_build_object(
            'posts', '[]'::jsonb,
            'next_cursor', NULL,
            'can_view', FALSE
        );
    END IF;

    IF v_me IS NOT NULL AND NOT v_is_owner THEN
        SELECT EXISTS (
            SELECT 1
              FROM public.connections c
             WHERE c.status = 'accepted'
               AND ((c.requester_id = v_me AND c.receiver_id = p_target_user_id)
                 OR (c.receiver_id = v_me AND c.requester_id = p_target_user_id))
        ) INTO v_is_connected;
    END IF;

    WITH feed AS (
        SELECT p.id, p.author_id, p.content, p.post_type, p.media,
               p.visibility, p.created_at
          FROM public.posts p
         WHERE p.author_id = p_target_user_id
           AND p.deleted_at IS NULL
           AND p.status = 'active'
           AND (
               v_is_owner
               OR p.visibility = 'public'
               OR (p.visibility = 'connections' AND v_is_connected)
           )
           AND (p_posts_cursor IS NULL OR p.created_at < p_posts_cursor)
         ORDER BY p.created_at DESC
         LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(x) ORDER BY x.ord), '[]'::jsonb)
      INTO v_posts
      FROM (
          SELECT
              row_number() OVER (ORDER BY f.created_at DESC) AS ord,
              f.id,
              f.author_id   AS "authorId",
              f.content,
              f.post_type   AS "postType",
              f.media,
              f.visibility,
              f.created_at  AS "createdAt",
              jsonb_build_object(
                  'userId',      f.author_id,
                  'role',        au.role,
                  'displayName', COALESCE(amp.full_name, acp.name),
                  'avatarUrl',   COALESCE(amp.avatar_url, acp.logo_url),
                  'headline',    COALESCE(amp.headline, acp.industry)
              ) AS author,
              (SELECT COUNT(*) FROM public.post_reactions r WHERE r.post_id = f.id) AS "reactionCount",
              (SELECT COUNT(*) FROM public.post_comments cm
                WHERE cm.post_id = f.id AND cm.deleted_at IS NULL AND cm.status = 'active') AS "commentCount",
              (SELECT COUNT(*) FROM public.post_shares sh WHERE sh.post_id = f.id) AS "shareCount",
              CASE
                WHEN v_me IS NULL THEN FALSE
                ELSE EXISTS (
                    SELECT 1 FROM public.post_reactions r
                     WHERE r.post_id = f.id AND r.user_id = v_me
                )
              END AS "viewerReacted"
            FROM feed f
            JOIN public.users au ON au.id = f.author_id
            LEFT JOIN public.member_profiles  amp ON amp.user_id = f.author_id AND amp.deleted_at IS NULL
            LEFT JOIN public.company_profiles acp ON acp.user_id = f.author_id AND acp.deleted_at IS NULL
      ) x;

    RETURN jsonb_build_object(
        'posts', v_posts,
        'next_cursor', (
            SELECT (v_posts -> (jsonb_array_length(v_posts) - 1) ->> 'createdAt')::TIMESTAMPTZ
            WHERE jsonb_array_length(v_posts) = p_posts_limit
        ),
        'can_view', TRUE
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_posts(BIGINT, TIMESTAMPTZ, INT)
    TO anon, authenticated;

-- =============================================================================
-- 15. LARAVEL FRAMEWORK TABLES — cache, queue, sanctum tokens
-- Các bảng này Laravel runtime cần. Nếu hosting chạy Octane/queue thì bắt buộc.
-- =============================================================================
CREATE TABLE IF NOT EXISTS cache (
    key        VARCHAR(255) PRIMARY KEY,
    value      TEXT NOT NULL,
    expiration INT NOT NULL
);

CREATE TABLE IF NOT EXISTS cache_locks (
    key        VARCHAR(255) PRIMARY KEY,
    owner      VARCHAR(255) NOT NULL,
    expiration INT NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id              BIGSERIAL PRIMARY KEY,
    tokenable_type  VARCHAR(255) NOT NULL,
    tokenable_id    BIGINT NOT NULL,
    name            VARCHAR(255) NOT NULL,
    token           VARCHAR(64)  NOT NULL UNIQUE,
    abilities       TEXT NULL,
    last_used_at    TIMESTAMPTZ NULL,
    expires_at      TIMESTAMPTZ NULL,
    created_at      TIMESTAMPTZ NULL,
    updated_at      TIMESTAMPTZ NULL,
    CONSTRAINT fk_pat_tokenable_user FOREIGN KEY (tokenable_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pat_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);

-- =============================================================================
-- 16. SEED DATA — dữ liệu khởi tạo tối thiểu
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TÀI KHOẢN ADMIN MẶC ĐỊNH
-- ---------------------------------------------------------------------------
-- Email:     admincp@joblink.local
-- Mật khẩu:  ChangeMe@123 (tạo qua Supabase Auth UI hoặc API)
-- Với Supabase Auth, mật khẩu được quản lý bởi auth.users, KHÔNG lưu trong
-- bảng public.users. Cần tạo user này trong Supabase Auth Dashboard hoặc
-- dùng supabase-admin API (auth.admin.createUser()) để đồng bộ.
-- Sau đó trigger handle_new_user sẽ tự động chèn vào public.users.
-- Nếu không dùng Supabase Auth, có thể insert thủ công với auth_id tuỳ ý.
-- ---------------------------------------------------------------------------
INSERT INTO users (auth_id, email, role, status, email_verified_at, locale, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admincp@joblink.local',
    'admin',
    'active',
    NOW(),
    'vi',
    NOW(),
    NOW()
);

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('site_name',         'site_identity', '"Joblink"'::jsonb,                                          FALSE),
    ('site_description',  'site_identity', '"Mạng xã hội việc làm và tuyển dụng chuyên nghiệp"'::jsonb, FALSE),
    ('site_logo_url',     'site_identity', 'null'::jsonb,                                               FALSE),
    ('site_favicon_url',  'site_identity', 'null'::jsonb,                                               FALSE),
    ('default_locale',    'regional',      '"vi"'::jsonb,                                               FALSE),
    ('default_timezone',  'regional',      '"Asia/Ho_Chi_Minh"'::jsonb,                                 FALSE),
    ('default_currency',  'regional',      '"VND"'::jsonb,                                              FALSE),
    ('available_locales', 'regional',      '["vi","en"]'::jsonb,                                        FALSE),
    ('smtp_host',         'smtp',          'null'::jsonb,                                               TRUE),
    ('smtp_port',         'smtp',          '587'::jsonb,                                                FALSE),
    ('smtp_username',     'smtp',          'null'::jsonb,                                               TRUE),
    ('smtp_password',     'smtp',          'null'::jsonb,                                               TRUE),
    ('smtp_encryption',   'smtp',          '"tls"'::jsonb,                                              FALSE),
    ('smtp_from_email',   'smtp',          'null'::jsonb,                                               FALSE),
    ('smtp_from_name',    'smtp',          '"Joblink"'::jsonb,                                          FALSE),
    ('recaptcha_enabled', 'recaptcha',     'false'::jsonb,                                              FALSE),
    ('recaptcha_site_key','recaptcha',     'null'::jsonb,                                               FALSE),
    ('recaptcha_secret',  'recaptcha',     'null'::jsonb,                                               TRUE),
    ('login_rate_limit',  'security',      '10'::jsonb,                                                 FALSE),
    ('upload_max_mb',     'security',      '10'::jsonb,                                                 FALSE),
    ('require_2fa_admin', 'security',      'true'::jsonb,                                               FALSE);

-- ---------------------------------------------------------------------------
-- SEED LOOKUP CATEGORIES
-- Admin có thể tiếp tục thêm/sửa/xoá qua UI quản trị.
-- is_system = TRUE đánh dấu các bản ghi gốc — UI nên chặn xoá.
-- ---------------------------------------------------------------------------
INSERT INTO job_types (code, name, name_en, sort_order, is_system) VALUES
    ('fulltime',   'Toàn thời gian',  'Full-time',  1, TRUE),
    ('parttime',   'Bán thời gian',   'Part-time',  2, TRUE),
    ('internship', 'Thực tập',        'Internship', 3, TRUE),
    ('contract',   'Hợp đồng',        'Contract',   4, TRUE),
    ('freelance',  'Tự do',           'Freelance',  5, TRUE);

INSERT INTO work_modes (code, name, name_en, sort_order, is_system) VALUES
    ('onsite', 'Tại văn phòng', 'On-site', 1, TRUE),
    ('remote', 'Từ xa',         'Remote',  2, TRUE),
    ('hybrid', 'Kết hợp',       'Hybrid',  3, TRUE);

-- Một số vị trí việc làm mẫu (admin tự mở rộng).
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

-- Tỉnh thành mẫu (Việt Nam — sau sắp xếp đơn vị hành chính 2025).
-- Admin có thể chỉnh sửa danh sách đầy đủ qua UI quản trị.
INSERT INTO provinces (code, name, sort_order) VALUES
    ('HN',  'Hà Nội',         10),
    ('HCM', 'TP. Hồ Chí Minh', 20),
    ('DN',  'Đà Nẵng',        30),
    ('HP',  'Hải Phòng',      40),
    ('CT',  'Cần Thơ',        50),
    ('HUE', 'Huế',            60);
