-- =============================================================================
-- JOBLINK DATABASE SCHEMA
-- PostgreSQL / Supabase
-- Charset: UTF8
-- Thiết kế theo SRS Joblink v1.0 (phiên bản đơn giản hoá 19/05/2026)
--
-- ⮕ ĐÂY LÀ SCHEMA HỢP NHẤT (AUTHORITATIVE): bao gồm toàn bộ bảng, index, trigger,
--   view, RPC, RLS, realtime và storage đã gộp từ supabase/migrations (đến
--   20260528_021). Xem file này thay vì đọc từng migration.
-- ⮕ ĐÃ LOẠI các bảng framework dư thừa không dùng trong stack Next.js + Supabase:
--   cache, cache_locks, personal_access_tokens, password_reset_tokens,
--   email_verification_tokens, và cột users.remember_token. Reset mật khẩu /
--   xác minh email do Supabase Auth (auth.users) quản lý.
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
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- GIN trgm cho ILIKE search (profile/job)

-- Helper: polymorphic row_to_jsonb (dùng trong RPC home feed)
CREATE OR REPLACE FUNCTION row_to_jsonb(ANYELEMENT)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_jsonb($1);
$$;

-- =============================================================================
-- Helper functions cho RLS / RPC — ánh xạ auth.uid() (Supabase) → public.users
--   • auth_user_id() → id của user hiện tại trong public.users
--   • is_admin()     → user hiện tại có role = 'admin' không
-- SECURITY DEFINER + search_path cố định để dùng an toàn trong RLS policies.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id FROM public.users u
   WHERE u.auth_id = auth.uid()
     AND u.deleted_at IS NULL
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.role = 'admin'
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.auth_user_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()     TO anon, authenticated;

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
-- Lưu ý: KHÔNG có password_reset_tokens / email_verification_tokens —
-- Supabase Auth (auth.users) tự quản lý reset mật khẩu & xác minh email.

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

-- SECURITY DEFINER: trigger ghi audit_logs phải bypass RLS của caller
-- (audit_logs không mở INSERT cho authenticated). SET search_path chống hijack.
CREATE OR REPLACE FUNCTION joblink_audit_soft_delete_users() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
    VALUES('soft_delete', 'users', NEW.id,
           jsonb_build_object('email', OLD.email, 'role', OLD.role, 'status', OLD.status));
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
-- SECURITY DEFINER: counter đụng cả 2 user (requester + receiver), vượt quá
-- phạm vi RLS "chỉ sửa row của mình" → cần quyền owner.
CREATE OR REPLACE FUNCTION public.connections_counter_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
              ) AS "viewerReacted",
              CASE
                WHEN f.post_type = 'poll' THEN (
                  SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                      'id', po.id,
                      'optionText', po.option_text,
                      'voteCount', CASE
                        WHEN v_me IS NULL THEN 0
                        WHEN f.author_id = v_me THEN po.vote_count
                        WHEN EXISTS (
                          SELECT 1 FROM public.poll_votes pv3
                           WHERE pv3.post_id = f.id AND pv3.user_id = v_me
                        ) THEN po.vote_count
                        ELSE 0
                      END,
                      'viewerVoted', CASE
                        WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS (
                          SELECT 1 FROM public.poll_votes pv
                           WHERE pv.option_id = po.id AND pv.user_id = v_me
                        )
                      END
                    ) ORDER BY po.id
                  ), '[]'::jsonb)
                  FROM public.poll_options po
                  WHERE po.post_id = f.id
                )
                ELSE NULL
              END AS "pollOptions"
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
              END AS "viewerReacted",
              CASE
                WHEN f.post_type = 'poll' THEN (
                  SELECT COALESCE(jsonb_agg(
                    jsonb_build_object(
                      'id', po.id,
                      'optionText', po.option_text,
                      'voteCount', CASE
                        WHEN v_me IS NULL THEN 0
                        WHEN f.author_id = v_me THEN po.vote_count
                        WHEN EXISTS (
                          SELECT 1 FROM public.poll_votes pv3
                           WHERE pv3.post_id = f.id AND pv3.user_id = v_me
                        ) THEN po.vote_count
                        ELSE 0
                      END,
                      'viewerVoted', CASE
                        WHEN v_me IS NULL THEN FALSE
                        ELSE EXISTS (
                          SELECT 1 FROM public.poll_votes pv
                           WHERE pv.option_id = po.id AND pv.user_id = v_me
                        )
                      END
                    ) ORDER BY po.id
                  ), '[]'::jsonb)
                  FROM public.poll_options po
                  WHERE po.post_id = f.id
                )
                ELSE NULL
              END AS "pollOptions"
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
-- 14c. POLL VOTE COUNT INCREMENT — atomic counter update
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_poll_vote_count(
    p_option_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.poll_options
       SET vote_count = vote_count + 1
     WHERE id = p_option_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_poll_vote_count(BIGINT)
    TO authenticated;

-- -----------------------------------------------------------------------------
-- RPC: update_poll_media — rebuild posts.media from poll_options after vote
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_poll_media(p_post_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_options JSONB;
    v_total_votes INT;
    v_media JSONB;
BEGIN
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', po.id,
            'optionText', po.option_text,
            'voteCount', po.vote_count
        ) ORDER BY po.id
    ), '[]'::jsonb)
    INTO v_options
    FROM public.poll_options po
    WHERE po.post_id = p_post_id;

    SELECT COALESCE(SUM(po.vote_count), 0)
    INTO v_total_votes
    FROM public.poll_options po
    WHERE po.post_id = p_post_id;

    v_media := jsonb_build_object(
        'type', 'poll',
        'options', v_options,
        'totalVotes', v_total_votes
    );

    UPDATE public.posts
    SET media = v_media
    WHERE id = p_post_id
      AND deleted_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_poll_media(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- Trigger: auto-update poll_options.vote_count + posts.media on poll_votes INSERT
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_after_poll_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.poll_options
       SET vote_count = vote_count + 1
     WHERE id = NEW.option_id;

    PERFORM public.update_poll_media(NEW.post_id);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_poll_vote_after_insert ON public.poll_votes;

CREATE TRIGGER trg_poll_vote_after_insert
    AFTER INSERT ON public.poll_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_after_poll_vote();


-- #############################################################################
-- 15. NETWORK PERFORMANCE — pg_trgm + indexes + get_network_overview (M04)
-- #############################################################################
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
            LEFT JOIN public.districts md  ON md.id  = mp.district_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.districts cd  ON cd.id = cp.district_id
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
            LEFT JOIN public.districts md  ON md.id  = mp.district_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.districts cd  ON cd.id = cp.district_id
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
            LEFT JOIN public.districts md  ON md.id = mp.district_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.districts cd  ON cd.id = cp.district_id
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
            LEFT JOIN public.districts md  ON md.id = mp.district_id
            LEFT JOIN public.provinces cpr ON cpr.id = cp.province_id
            LEFT JOIN public.districts cd  ON cd.id = cp.district_id
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


-- #############################################################################
-- 16. MESSAGING — indexes + after-insert trigger + get_conversation_messages (M06)
-- #############################################################################
-- Lấy lịch sử conversation theo created_at DESC (newest-first cursor)
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_desc
    ON public.messages(conversation_id, created_at DESC, id DESC)
    WHERE deleted_at IS NULL;

-- Đếm unread per conversation: COUNT WHERE created_at > last_read_at AND sender_id <> me
CREATE INDEX IF NOT EXISTS idx_messages_conv_sender_created
    ON public.messages(conversation_id, sender_id, created_at)
    WHERE deleted_at IS NULL;

-- Lấy danh sách conversation của user theo "vừa có hoạt động"
CREATE INDEX IF NOT EXISTS idx_conversations_updated_desc
    ON public.conversations(updated_at DESC);

-- conversation_participants per user (đã có idx_conv_participants_user, partial cho hot path)
CREATE INDEX IF NOT EXISTS idx_conv_participants_user_lastread
    ON public.conversation_participants(user_id, last_read_at);

-- -----------------------------------------------------------------------------
-- 2. Trigger: khi message mới insert → bump conversations.updated_at và auto
--    update last_read_at của sender (vì chính họ vừa "đọc" tin của mình).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.joblink_after_message_insert()
RETURNS trigger AS $$
BEGIN
    UPDATE public.conversations
       SET updated_at = NEW.created_at
     WHERE id = NEW.conversation_id;

    UPDATE public.conversation_participants
       SET last_read_at = NEW.created_at
     WHERE conversation_id = NEW.conversation_id
       AND user_id = NEW.sender_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_messages_after_insert ON public.messages;
CREATE TRIGGER trg_messages_after_insert
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.joblink_after_message_insert();

-- -----------------------------------------------------------------------------
-- 5. RPC: get_conversation_messages — phân trang DESC theo created_at + id
--    Trả về thêm "otherUserId" để client biết hiển thị tên/avatar.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_conversation_messages(
    p_conversation_id BIGINT,
    p_before_created_at TIMESTAMPTZ DEFAULT NULL,
    p_before_id BIGINT DEFAULT NULL,
    p_limit INT DEFAULT 40
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_is_participant BOOLEAN;
    v_other_user_id BIGINT;
    v_items JSONB;
    v_has_more BOOLEAN;
    v_limit INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'hasMore', FALSE, 'otherUserId', NULL);
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) INTO v_is_participant;

    IF NOT v_is_participant THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'hasMore', FALSE, 'otherUserId', NULL);
    END IF;

    SELECT cp.user_id INTO v_other_user_id
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me
     LIMIT 1;

    v_limit := GREATEST(LEAST(COALESCE(p_limit, 40), 100), 1);

    WITH page AS (
        SELECT m.id,
               m.sender_id,
               m.content,
               m.media,
               m.read_at,
               m.created_at
          FROM public.messages m
         WHERE m.conversation_id = p_conversation_id
           AND m.deleted_at IS NULL
           AND (
               p_before_created_at IS NULL
               OR m.created_at < p_before_created_at
               OR (m.created_at = p_before_created_at AND m.id < COALESCE(p_before_id, 9223372036854775807))
           )
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT v_limit + 1
    ),
    sliced AS (
        SELECT * FROM page LIMIT v_limit
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', s.id,
            'senderId', s.sender_id,
            'content', s.content,
            'media', s.media,
            'readAt', s.read_at,
            'createdAt', s.created_at
        ) ORDER BY s.created_at ASC, s.id ASC), '[]'::jsonb),
        (SELECT COUNT(*) FROM page) > v_limit
      INTO v_items, v_has_more
      FROM sliced s;

    RETURN jsonb_build_object(
        'items', v_items,
        'hasMore', COALESCE(v_has_more, FALSE),
        'otherUserId', v_other_user_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_messages(BIGINT, TIMESTAMPTZ, BIGINT, INT) TO authenticated;


-- #############################################################################
-- 16b. MESSAGING PERF — indexes + get_unread_conversations_count + get_messaging_overview (final)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260526_015 — MESSAGING PERF
-- =============================================================================
-- Mục tiêu:
--   • Index hot path còn thiếu cho rate-limit + mark-as-read.
--   • Tối ưu get_unread_conversations_count: thay vì COUNT DISTINCT toàn bộ
--     JOIN, dùng EXISTS-per-participant → giảm rows quét.
--   • get_messaging_overview: gộp user_blocks lookups vào 1 CTE thay vì 2
--     subquery EXISTS per row (giảm planner work khi list dài).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index bổ sung
-- -----------------------------------------------------------------------------
-- Rate-limit window: SELECT COUNT WHERE sender_id = me AND created_at >= now()-1m
CREATE INDEX IF NOT EXISTS idx_messages_sender_created
    ON public.messages(sender_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- mark_conversation_read UPDATE đụng vào "tin chưa đọc của người kia": có
-- (conversation_id, sender_id) sẵn nhưng thêm partial cho read_at IS NULL
-- để rút ngắn scan khi convo lớn.
CREATE INDEX IF NOT EXISTS idx_messages_unread_per_conv
    ON public.messages(conversation_id, sender_id)
    WHERE read_at IS NULL AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: get_unread_conversations_count v2
--    Trước: COUNT(DISTINCT m.conversation_id) JOIN messages (quét toàn bộ
--    messages chưa đọc của user). Sau: EXISTS-per-participant (chạy 1 lookup
--    nhanh cho mỗi conversation user tham gia, dừng ngay khi gặp tin chưa đọc).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_unread_conversations_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_count INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN RETURN 0; END IF;

    SELECT COUNT(*)::INT
      INTO v_count
      FROM public.conversation_participants cp
     WHERE cp.user_id = v_me
       AND EXISTS (
           SELECT 1
             FROM public.messages m
            WHERE m.conversation_id = cp.conversation_id
              AND m.deleted_at IS NULL
              AND m.sender_id <> v_me
              AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
            LIMIT 1
       );

    RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_conversations_count() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: get_messaging_overview v3 — gộp user_blocks CTE.
--    Vẫn trả về items dạng cũ (placeholder + conversation), nhưng dùng 1 CTE
--    `blocks` ánh xạ (other_id → blocked_by_me|blocked_me) thay vì 2 EXISTS
--    subquery per row. Khi list 50 conversation, đỡ ~100 lần lookup user_blocks.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_messaging_overview(
    p_limit INT DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_items JSONB;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0);
    END IF;

    WITH my_conv AS (
        SELECT cp.conversation_id, cp.last_read_at
          FROM public.conversation_participants cp
         WHERE cp.user_id = v_me
    ),
    other_part AS (
        SELECT mc.conversation_id, cp.user_id AS other_user_id, mc.last_read_at
          FROM my_conv mc
          JOIN public.conversation_participants cp
            ON cp.conversation_id = mc.conversation_id
           AND cp.user_id <> v_me
    ),
    last_msg AS (
        SELECT DISTINCT ON (m.conversation_id)
               m.conversation_id,
               m.id          AS last_message_id,
               m.sender_id   AS last_sender_id,
               m.content     AS last_content,
               m.media       AS last_media,
               m.created_at  AS last_created_at
          FROM public.messages m
         WHERE m.deleted_at IS NULL
           AND m.conversation_id IN (SELECT conversation_id FROM my_conv)
         ORDER BY m.conversation_id, m.created_at DESC, m.id DESC
    ),
    unread AS (
        SELECT m.conversation_id, COUNT(*)::INT AS unread_count
          FROM public.messages m
          JOIN my_conv mc ON mc.conversation_id = m.conversation_id
         WHERE m.deleted_at IS NULL
           AND m.sender_id <> v_me
           AND (mc.last_read_at IS NULL OR m.created_at > mc.last_read_at)
         GROUP BY m.conversation_id
    ),
    my_connections AS (
        SELECT CASE WHEN cn.requester_id = v_me THEN cn.receiver_id
                    ELSE cn.requester_id END AS other_id,
               COALESCE(cn.responded_at, cn.requested_at) AS connected_at
          FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND (cn.requester_id = v_me OR cn.receiver_id = v_me)
    ),
    connections_without_convo AS (
        SELECT mc.other_id, mc.connected_at
          FROM my_connections mc
         WHERE mc.other_id NOT IN (SELECT other_user_id FROM other_part)
    ),
    -- Gộp danh sách other_id để 1 lần quét user_blocks duy nhất.
    all_others AS (
        SELECT other_user_id AS other_id FROM other_part
        UNION
        SELECT other_id FROM connections_without_convo
    ),
    blocks AS (
        SELECT
            a.other_id,
            COALESCE(bool_or(ub.blocker_id = v_me AND ub.blocked_id = a.other_id), FALSE)
                AS blocked_by_me,
            COALESCE(bool_or(ub.blocker_id = a.other_id AND ub.blocked_id = v_me), FALSE)
                AS blocked_me
          FROM all_others a
          LEFT JOIN public.user_blocks ub
            ON (ub.blocker_id = v_me AND ub.blocked_id = a.other_id)
            OR (ub.blocker_id = a.other_id AND ub.blocked_id = v_me)
         GROUP BY a.other_id
    ),
    convo_rows AS (
        SELECT
            c.id                              AS "conversationId",
            c.updated_at                      AS "updatedAt",
            op.other_user_id                  AS "otherUserId",
            COALESCE(mp.full_name, cp.name)   AS "displayName",
            COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
            COALESCE(mp.headline, cp.industry)   AS "headline",
            u.role                            AS role,
            lm.last_message_id                AS "lastMessageId",
            lm.last_sender_id                 AS "lastSenderId",
            lm.last_content                   AS "lastContent",
            lm.last_media                     AS "lastMedia",
            lm.last_created_at                AS "lastCreatedAt",
            COALESCE(unr.unread_count, 0)     AS "unreadCount",
            TRUE                              AS "isConnected",
            COALESCE(b.blocked_by_me, FALSE)  AS "blockedByMe",
            COALESCE(b.blocked_me, FALSE)     AS "blockedMe",
            COALESCE(lm.last_created_at, c.updated_at) AS sort_key
          FROM other_part op
          JOIN public.conversations c   ON c.id = op.conversation_id
          JOIN public.users u           ON u.id = op.other_user_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = op.other_user_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = op.other_user_id AND cp.deleted_at IS NULL
          LEFT JOIN last_msg lm ON lm.conversation_id = op.conversation_id
          LEFT JOIN unread   unr ON unr.conversation_id = op.conversation_id
          LEFT JOIN blocks   b   ON b.other_id = op.other_user_id
    ),
    placeholder_rows AS (
        SELECT
            NULL::BIGINT                      AS "conversationId",
            cwc.connected_at                  AS "updatedAt",
            cwc.other_id                      AS "otherUserId",
            COALESCE(mp.full_name, cp.name)   AS "displayName",
            COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl",
            COALESCE(mp.headline, cp.industry)   AS "headline",
            u.role                            AS role,
            NULL::BIGINT                      AS "lastMessageId",
            NULL::BIGINT                      AS "lastSenderId",
            NULL::TEXT                        AS "lastContent",
            NULL::JSONB                       AS "lastMedia",
            NULL::TIMESTAMPTZ                 AS "lastCreatedAt",
            0::INT                            AS "unreadCount",
            TRUE                              AS "isConnected",
            COALESCE(b.blocked_by_me, FALSE)  AS "blockedByMe",
            COALESCE(b.blocked_me, FALSE)     AS "blockedMe",
            cwc.connected_at                  AS sort_key
          FROM connections_without_convo cwc
          JOIN public.users u ON u.id = cwc.other_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = cwc.other_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = cwc.other_id AND cp.deleted_at IS NULL
          LEFT JOIN blocks b ON b.other_id = cwc.other_id
         WHERE u.deleted_at IS NULL
    ),
    all_rows AS (
        SELECT * FROM convo_rows
        UNION ALL
        SELECT * FROM placeholder_rows
    )
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'conversationId',  ar."conversationId",
            'updatedAt',       ar."updatedAt",
            'otherUserId',     ar."otherUserId",
            'displayName',     ar."displayName",
            'avatarUrl',       ar."avatarUrl",
            'headline',        ar."headline",
            'role',            ar.role,
            'lastMessageId',   ar."lastMessageId",
            'lastSenderId',    ar."lastSenderId",
            'lastContent',     ar."lastContent",
            'lastMedia',       ar."lastMedia",
            'lastCreatedAt',   ar."lastCreatedAt",
            'unreadCount',     ar."unreadCount",
            'isConnected',     ar."isConnected",
            'blockedByMe',     ar."blockedByMe",
            'blockedMe',       ar."blockedMe"
        )
        ORDER BY ar.sort_key DESC NULLS LAST
    ), '[]'::jsonb)
      INTO v_items
      FROM (
          SELECT * FROM all_rows
           ORDER BY sort_key DESC NULLS LAST
           LIMIT p_limit
      ) ar;

    RETURN jsonb_build_object(
        'items', v_items,
        'unreadConversations', COALESCE((
            SELECT COUNT(*)::INT FROM jsonb_array_elements(v_items) e
             WHERE (e->>'unreadCount')::INT > 0
        ), 0)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_messaging_overview(INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260526_015
-- =============================================================================


-- #############################################################################
-- 16c. MESSAGING MUTATIONS (SECURITY DEFINER) — find_or_create / send_message / mark_conversation_read
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260524_014 — MESSAGING RPC SECURITY DEFINER
-- =============================================================================
-- Vấn đề: `find_or_create_direct_conversation` (SECURITY INVOKER) INSERT vào
-- `conversations` qua RLS → "new row violates row-level security policy".
-- Có thể do RLS policy `conversations_insert_any` chưa tồn tại / sai cấu hình.
--
-- Cách sửa: chuyển 3 RPC mutate (find_or_create, send_message,
-- mark_conversation_read) sang SECURITY DEFINER. RPC đã tự validate (check
-- auth, participant, connection, block, rate-limit) nên an toàn hơn là phụ
-- thuộc RLS — không phá vỡ mô hình bảo mật.
--
-- Quy ước: dùng `SET search_path = public` để không bị attack qua schema
-- trỏ trước (Postgres best practice cho SECURITY DEFINER).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. find_or_create_direct_conversation
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_or_create_direct_conversation(
    p_other_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_conv_id BIGINT;
    v_ok BOOLEAN;
    v_blocked BOOLEAN;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF v_me = p_other_user_id THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotMessageSelf');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND ((cn.requester_id = v_me AND cn.receiver_id = p_other_user_id)
             OR (cn.requester_id = p_other_user_id AND cn.receiver_id = v_me))
    ) INTO v_ok;

    IF NOT v_ok THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.user_blocks ub
         WHERE (ub.blocker_id = v_me AND ub.blocked_id = p_other_user_id)
            OR (ub.blocker_id = p_other_user_id AND ub.blocked_id = v_me)
    ) INTO v_blocked;

    IF v_blocked THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked');
    END IF;

    SELECT c.id INTO v_conv_id
      FROM public.conversations c
     WHERE c.type = 'direct'
       AND EXISTS(
           SELECT 1 FROM public.conversation_participants cp1
            WHERE cp1.conversation_id = c.id AND cp1.user_id = v_me
       )
       AND EXISTS(
           SELECT 1 FROM public.conversation_participants cp2
            WHERE cp2.conversation_id = c.id AND cp2.user_id = p_other_user_id
       )
       AND (
           SELECT COUNT(*) FROM public.conversation_participants cp3
            WHERE cp3.conversation_id = c.id
       ) = 2
     LIMIT 1;

    IF v_conv_id IS NULL THEN
        INSERT INTO public.conversations(type) VALUES ('direct')
        RETURNING id INTO v_conv_id;

        INSERT INTO public.conversation_participants(conversation_id, user_id)
        VALUES (v_conv_id, v_me), (v_conv_id, p_other_user_id);
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'conversationId', v_conv_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_or_create_direct_conversation(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. send_message
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_message(
    p_conversation_id BIGINT,
    p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
    v_other BIGINT;
    v_ok BOOLEAN;
    v_blocked BOOLEAN;
    v_recent INT;
    v_new_id BIGINT;
    v_created_at TIMESTAMPTZ;
    v_trim TEXT;
BEGIN
    v_trim := btrim(COALESCE(p_content, ''));
    IF v_trim = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'emptyContent');
    END IF;
    IF char_length(v_trim) > 4000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'tooLong');
    END IF;

    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF NOT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant');
    END IF;

    SELECT cp.user_id INTO v_other
      FROM public.conversation_participants cp
     WHERE cp.conversation_id = p_conversation_id AND cp.user_id <> v_me
     LIMIT 1;

    SELECT EXISTS(
        SELECT 1 FROM public.connections cn
         WHERE cn.status = 'accepted'
           AND ((cn.requester_id = v_me AND cn.receiver_id = v_other)
             OR (cn.requester_id = v_other AND cn.receiver_id = v_me))
    ) INTO v_ok;

    IF NOT v_ok THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notConnected');
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.user_blocks ub
         WHERE (ub.blocker_id = v_me AND ub.blocked_id = v_other)
            OR (ub.blocker_id = v_other AND ub.blocked_id = v_me)
    ) INTO v_blocked;

    IF v_blocked THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'blocked');
    END IF;

    SELECT COUNT(*)::INT INTO v_recent
      FROM public.messages m
     WHERE m.sender_id = v_me
       AND m.created_at >= NOW() - INTERVAL '1 minute';

    IF v_recent >= 60 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'rateLimited');
    END IF;

    INSERT INTO public.messages(conversation_id, sender_id, content)
    VALUES (p_conversation_id, v_me, v_trim)
    RETURNING id, created_at INTO v_new_id, v_created_at;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'message', jsonb_build_object(
            'id', v_new_id,
            'senderId', v_me,
            'content', v_trim,
            'media', NULL,
            'readAt', NULL,
            'createdAt', v_created_at
        ),
        'recipientId', v_other
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(BIGINT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. mark_conversation_read
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_conversation_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_me BIGINT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    -- Chỉ user tự mark conversation MÌNH tham gia
    IF NOT EXISTS(
        SELECT 1 FROM public.conversation_participants
         WHERE conversation_id = p_conversation_id AND user_id = v_me
    ) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notParticipant');
    END IF;

    UPDATE public.conversation_participants
       SET last_read_at = NOW()
     WHERE conversation_id = p_conversation_id
       AND user_id = v_me;

    UPDATE public.messages
       SET read_at = NOW()
     WHERE conversation_id = p_conversation_id
       AND sender_id <> v_me
       AND read_at IS NULL
       AND deleted_at IS NULL;

    RETURN jsonb_build_object('ok', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(BIGINT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260524_014
-- =============================================================================


-- #############################################################################
-- 17. ROW LEVEL SECURITY — messaging tables (is_my_conversation + policies)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260524_012 — FIX RLS RECURSION TRÊN MESSAGING TABLES
-- =============================================================================
-- Vấn đề: policy `conversation_participants_select` trong rls_policies.sql có
-- subquery EXISTS query lại chính `conversation_participants` → infinite
-- recursion khi Postgres đánh giá RLS.
--
-- Cách sửa:
--   • Tạo helper SECURITY DEFINER `is_my_conversation(conv_id)` — bypass RLS
--     khi check "user hiện tại có phải participant của conversation X không".
--   • Recreate policies SELECT của 3 bảng (conversations, conversation_part-
--     icipants, messages) dùng helper này, không subquery vòng tròn.
--   • Idempotent: DROP POLICY IF EXISTS rồi CREATE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper bypass RLS: kiểm tra user hiện tại có phải participant không
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_my_conversation(p_conversation_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1
      FROM public.conversation_participants cp
      JOIN public.users u ON u.id = cp.user_id
     WHERE cp.conversation_id = p_conversation_id
       AND u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_conversation(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. conversation_participants — policy SELECT không tự query lại chính nó
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversation_participants_select       ON public.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_admin_all    ON public.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_insert_own   ON public.conversation_participants;

CREATE POLICY conversation_participants_admin_all
  ON public.conversation_participants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Cho phép user xem TẤT CẢ participant của các conversation mà mình là thành
-- viên (cần để biết "người đối diện" trong direct chat).
CREATE POLICY conversation_participants_select
  ON public.conversation_participants
  FOR SELECT
  USING (public.is_my_conversation(conversation_id));

CREATE POLICY conversation_participants_insert_own
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

-- Cho phép user cập nhật last_read_at của chính mình
DROP POLICY IF EXISTS conversation_participants_update_own ON public.conversation_participants;
CREATE POLICY conversation_participants_update_own
  ON public.conversation_participants
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

-- -----------------------------------------------------------------------------
-- 3. conversations — dùng helper, không subquery cp trực tiếp
-- -----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_admin_all          ON public.conversations;
DROP POLICY IF EXISTS conversations_select_participant ON public.conversations;
DROP POLICY IF EXISTS conversations_insert_any         ON public.conversations;

CREATE POLICY conversations_admin_all
  ON public.conversations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY conversations_select_participant
  ON public.conversations
  FOR SELECT
  USING (public.is_my_conversation(id));

CREATE POLICY conversations_insert_any
  ON public.conversations
  FOR INSERT
  WITH CHECK (TRUE);

-- Cho phép trigger sau-insert message cập nhật updated_at của conversation.
-- Trigger chạy với quyền SECURITY DEFINER của joblink_after_message_insert(),
-- nhưng để dev tools (REST) cũng làm được khi cần, mở UPDATE cho participant.
DROP POLICY IF EXISTS conversations_update_participant ON public.conversations;
CREATE POLICY conversations_update_participant
  ON public.conversations
  FOR UPDATE
  USING (public.is_my_conversation(id))
  WITH CHECK (public.is_my_conversation(id));

-- -----------------------------------------------------------------------------
-- 4. messages — dùng helper thay cho EXISTS query cp
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_admin_all          ON public.messages;
DROP POLICY IF EXISTS messages_select_participant ON public.messages;
DROP POLICY IF EXISTS messages_insert_own         ON public.messages;
DROP POLICY IF EXISTS messages_update_own         ON public.messages;

CREATE POLICY messages_admin_all
  ON public.messages
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY messages_select_participant
  ON public.messages
  FOR SELECT
  USING (public.is_my_conversation(conversation_id));

CREATE POLICY messages_insert_own
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = public.auth_user_id()
    AND public.is_my_conversation(conversation_id)
  );

CREATE POLICY messages_update_own
  ON public.messages
  FOR UPDATE
  USING (sender_id = public.auth_user_id() AND deleted_at IS NULL)
  WITH CHECK (sender_id = public.auth_user_id());

-- Cho phép participant đánh dấu đã đọc (read_at) các message của người kia.
-- mark_conversation_read RPC sẽ UPDATE read_at cho messages sender_id <> me.
DROP POLICY IF EXISTS messages_update_read ON public.messages;
CREATE POLICY messages_update_read
  ON public.messages
  FOR UPDATE
  USING (public.is_my_conversation(conversation_id))
  WITH CHECK (public.is_my_conversation(conversation_id));

-- =============================================================================
-- END MIGRATION 20260524_012
-- =============================================================================


-- #############################################################################
-- 16c-bis. POSTS VISIBILITY RLS (migration 20260529_023)
-- #############################################################################
-- Enforce visibility (public / connections / private) ở tầng database thay vì
-- chỉ dựa vào các RPC ở tầng ứng dụng. Không có khối này, client cầm anon key
-- có thể gọi thẳng PostgREST để đọc bài 'private' của người khác hoặc sửa/xoá
-- bài người khác. Các RPC SECURITY INVOKER vốn đã lọc đúng tập visible nên kết
-- quả không đổi; admin dùng service-role bypass RLS.

-- DROP trước khi tạo: nếu DB đã có hàm cùng tên với tên tham số khác,
-- CREATE OR REPLACE sẽ báo "cannot change name of input parameter". CASCADE để
-- re-run được — mọi thứ phụ thuộc 2 hàm này chỉ là các RLS policy bên dưới,
-- bị drop kèm rồi được tạo lại ngay. DROP can_view_post trước (tham chiếu are_connected).
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

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_admin_all      ON public.posts;
DROP POLICY IF EXISTS posts_select_visible ON public.posts;
DROP POLICY IF EXISTS posts_insert_own     ON public.posts;
DROP POLICY IF EXISTS posts_update_own     ON public.posts;
DROP POLICY IF EXISTS posts_delete_own     ON public.posts;

CREATE POLICY posts_admin_all
  ON public.posts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY posts_select_visible
  ON public.posts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
         visibility = 'public'
      OR author_id = public.auth_user_id()
      OR (visibility = 'connections'
          AND public.are_connected(public.auth_user_id(), author_id))
    )
  );

CREATE POLICY posts_insert_own
  ON public.posts
  FOR INSERT
  WITH CHECK (author_id = public.auth_user_id());

CREATE POLICY posts_update_own
  ON public.posts
  FOR UPDATE
  USING (author_id = public.auth_user_id())
  WITH CHECK (author_id = public.auth_user_id());

CREATE POLICY posts_delete_own
  ON public.posts
  FOR DELETE
  USING (author_id = public.auth_user_id());

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_reactions_admin_all      ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_select_visible ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_insert_own     ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_delete_own     ON public.post_reactions;

CREATE POLICY post_reactions_admin_all
  ON public.post_reactions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY post_reactions_select_visible
  ON public.post_reactions
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY post_reactions_insert_own
  ON public.post_reactions
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));

CREATE POLICY post_reactions_delete_own
  ON public.post_reactions
  FOR DELETE
  USING (user_id = public.auth_user_id());

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_comments_admin_all      ON public.post_comments;
DROP POLICY IF EXISTS post_comments_select_visible ON public.post_comments;
DROP POLICY IF EXISTS post_comments_insert_own     ON public.post_comments;
DROP POLICY IF EXISTS post_comments_update_own     ON public.post_comments;

CREATE POLICY post_comments_admin_all
  ON public.post_comments
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY post_comments_select_visible
  ON public.post_comments
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY post_comments_insert_own
  ON public.post_comments
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));

CREATE POLICY post_comments_update_own
  ON public.post_comments
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_shares_admin_all      ON public.post_shares;
DROP POLICY IF EXISTS post_shares_select_visible ON public.post_shares;
DROP POLICY IF EXISTS post_shares_insert_own     ON public.post_shares;
DROP POLICY IF EXISTS post_shares_delete_own     ON public.post_shares;

CREATE POLICY post_shares_admin_all
  ON public.post_shares
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY post_shares_select_visible
  ON public.post_shares
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY post_shares_insert_own
  ON public.post_shares
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY post_shares_delete_own
  ON public.post_shares
  FOR DELETE
  USING (user_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260529_023
-- =============================================================================

-- =============================================================================
-- 16c-bis. POLL TABLES RLS (migration 20260530_024)
-- =============================================================================
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS poll_options_admin_all      ON public.poll_options;
DROP POLICY IF EXISTS poll_options_select_visible ON public.poll_options;
DROP POLICY IF EXISTS poll_options_insert_own     ON public.poll_options;
DROP POLICY IF EXISTS poll_options_update_own     ON public.poll_options;
DROP POLICY IF EXISTS poll_options_delete_own     ON public.poll_options;

CREATE POLICY poll_options_admin_all
  ON public.poll_options
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY poll_options_select_visible
  ON public.poll_options
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY poll_options_insert_own
  ON public.poll_options
  FOR INSERT
  WITH CHECK (
    post_id IN (
      SELECT p.id FROM public.posts p
       WHERE p.author_id = public.auth_user_id()
    )
  );

CREATE POLICY poll_options_update_own
  ON public.poll_options
  FOR UPDATE
  USING (
    post_id IN (
      SELECT p.id FROM public.posts p
       WHERE p.author_id = public.auth_user_id()
    )
  )
  WITH CHECK (
    post_id IN (
      SELECT p.id FROM public.posts p
       WHERE p.author_id = public.auth_user_id()
    )
  );

CREATE POLICY poll_options_delete_own
  ON public.poll_options
  FOR DELETE
  USING (
    post_id IN (
      SELECT p.id FROM public.posts p
       WHERE p.author_id = public.auth_user_id()
    )
  );

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS poll_votes_admin_all      ON public.poll_votes;
DROP POLICY IF EXISTS poll_votes_select_visible ON public.poll_votes;
DROP POLICY IF EXISTS poll_votes_insert_own     ON public.poll_votes;
DROP POLICY IF EXISTS poll_votes_delete_own     ON public.poll_votes;

CREATE POLICY poll_votes_admin_all
  ON public.poll_votes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY poll_votes_select_visible
  ON public.poll_votes
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY poll_votes_insert_own
  ON public.poll_votes
  FOR INSERT
  WITH CHECK (
    user_id = public.auth_user_id()
    AND public.can_view_post(post_id)
  );

CREATE POLICY poll_votes_delete_own
  ON public.poll_votes
  FOR DELETE
  USING (user_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260530_024
-- =============================================================================


-- #############################################################################
-- 16d. MESSAGING REALTIME — messages / conversations / participants
-- #############################################################################
-- -----------------------------------------------------------------------------
-- 9. Realtime: bật replication cho messages, conversations,
--    conversation_participants để client subscribe được postgres_changes.
-- -----------------------------------------------------------------------------
ALTER TABLE public.messages                  REPLICA IDENTITY DEFAULT;
ALTER TABLE public.conversations             REPLICA IDENTITY DEFAULT;
ALTER TABLE public.conversation_participants REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
           AND tablename = 'messages'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
           AND tablename = 'conversations'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
           AND tablename = 'conversation_participants'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants';
    END IF;
END
$$;

-- =============================================================================


-- #############################################################################
-- 18. REALTIME STREAMS — notifications / connections / profile_view_logs (M07,M04)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260521_005 — REALTIME STREAMS (M07 + M04)
-- =============================================================================
-- Mục tiêu:
--   • Bật replication cho notifications + connections vào publication
--     `supabase_realtime` để client subscribe được postgres_changes.
--   • Đặt REPLICA IDENTITY DEFAULT (theo primary key) trên các bảng này — bắt
--     buộc cho Supabase Realtime để chuyển payload UPDATE/DELETE.
--   • Idempotent: chạy lại nhiều lần không lỗi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Đảm bảo publication tồn tại (Supabase tạo sẵn, fallback an toàn)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 2. REPLICA IDENTITY — Supabase yêu cầu để stream UPDATE/DELETE đúng
-- -----------------------------------------------------------------------------
ALTER TABLE public.notifications      REPLICA IDENTITY DEFAULT;
ALTER TABLE public.connections        REPLICA IDENTITY DEFAULT;
ALTER TABLE public.profile_view_logs  REPLICA IDENTITY DEFAULT;

-- -----------------------------------------------------------------------------
-- 3. Add bảng vào publication (idempotent qua check pg_publication_tables)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'notifications'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'connections'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.connections';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'profile_view_logs'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_view_logs';
    END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 4. Bổ sung index hỗ trợ unread badge (đã có idx_notifications_user_unread
--    trên (user_id, read_at, created_at) trong schema.sql) — thêm partial
--    index riêng cho read_at IS NULL để count(*) WHERE read_at IS NULL nhanh
--    hơn với volume lớn.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_only
    ON public.notifications(user_id, created_at DESC)
    WHERE read_at IS NULL;

-- =============================================================================
-- END MIGRATION 20260521_005
-- =============================================================================


-- #############################################################################
-- 18b. REALTIME ENGAGEMENT — post reactions / comments / shares (M03)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260521_007 — REALTIME ENGAGEMENT (M03)
-- =============================================================================
-- Bật replication realtime cho engagement của posts:
--   • post_reactions — like/unlike → cập nhật reactionCount/viewerReacted
--   • post_comments  — bình luận mới/xoá → cập nhật commentCount + thread
--   • post_shares    — chia sẻ → cập nhật shareCount
-- Idempotent: chạy lại nhiều lần không lỗi.
-- =============================================================================

-- REPLICA IDENTITY DEFAULT bắt buộc cho Supabase Realtime để stream
-- UPDATE/DELETE payload đầy đủ theo primary key.
ALTER TABLE public.post_reactions REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_comments  REPLICA IDENTITY DEFAULT;
ALTER TABLE public.post_shares    REPLICA IDENTITY DEFAULT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'post_reactions'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'post_comments'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'post_shares'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.post_shares';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = 'posts'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.posts';
    END IF;
END
$$;

-- =============================================================================
-- END MIGRATION 20260521_007
-- =============================================================================


-- #############################################################################
-- 19. COMPANY PUBLIC PAGE — index + toggle_follow_company (M04)
-- #############################################################################
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- List/đếm active jobs của 1 công ty theo "mới nhất". Partial index giảm size
-- vì non-active job không bao giờ xuất hiện ở trang public.
CREATE INDEX IF NOT EXISTS idx_jobs_company_active_created
    ON public.jobs(company_user_id, created_at DESC)
    WHERE status = 'active' AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 3. RPC: toggle_follow_company
--    Idempotent: gọi 2 lần ⇒ về trạng thái ban đầu. Trả luôn count mới để UI
--    optimistic không cần fetch lại overview.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_follow_company(
    p_company_user_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_target_role TEXT;
    v_target_status TEXT;
    v_existing BIGINT;
    v_is_following BOOLEAN;
    v_count INT;
BEGIN
    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF v_me = p_company_user_id THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'selfFollow');
    END IF;

    SELECT u.role, u.status
      INTO v_target_role, v_target_status
      FROM public.users u
     WHERE u.id = p_company_user_id
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_target_role IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound');
    END IF;
    IF v_target_role <> 'company' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany');
    END IF;
    IF v_target_status <> 'active' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive');
    END IF;

    SELECT id INTO v_existing
      FROM public.follows
     WHERE follower_id = v_me
       AND followable_type = 'company'
       AND followable_id = p_company_user_id
     LIMIT 1;

    IF v_existing IS NOT NULL THEN
        DELETE FROM public.follows WHERE id = v_existing;
        v_is_following := FALSE;
    ELSE
        INSERT INTO public.follows(follower_id, followable_type, followable_id)
        VALUES (v_me, 'company', p_company_user_id)
        ON CONFLICT (follower_id, followable_type, followable_id) DO NOTHING;
        v_is_following := TRUE;
    END IF;

    SELECT COUNT(*)::INT
      INTO v_count
      FROM public.follows
     WHERE followable_type = 'company'
       AND followable_id = p_company_user_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'isFollowing', v_is_following,
        'followerCount', v_count
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_follow_company(BIGINT) TO authenticated;



-- #############################################################################
-- 20. COMPANY DASHBOARD — recruiter RPCs (M05)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260527_017 — COMPANY DASHBOARD (M05 owner-facing)
-- =============================================================================
-- Mục tiêu:
--   • Index hot path cho dashboard recruiter (jobs theo status, applications
--     join jobs theo công ty).
--   • RPC tổng hợp `get_company_dashboard_overview` — 1 round trip cho tab
--     Tổng quan (stats + recent jobs + recent applicants).
--   • RPC `get_company_jobs` — phân trang + lọc theo status + search.
--   • RPC `get_company_applicants` — phân trang + lọc theo job_id/status +
--     search theo tên ứng viên. Dùng cho cả tab Ứng viên và tab Pipeline.
--   • RPC `update_application_status` + `update_job_status` — owner-only,
--     insert history row, ghi nhận `changed_by`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- Lọc applications theo job + status (pipeline view). Đã có idx_job_apps_job
-- và idx_job_apps_status riêng — thêm composite + applied_at DESC để pipeline
-- sort newest-first không cần resort.
CREATE INDEX IF NOT EXISTS idx_job_apps_job_status_applied
    ON public.job_applications(job_id, status, applied_at DESC);

-- Lọc jobs của 1 công ty theo status + created_at DESC (jobs tab).
CREATE INDEX IF NOT EXISTS idx_jobs_company_status_created
    ON public.jobs(company_user_id, status, created_at DESC)
    WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: get_company_dashboard_overview
--    Yêu cầu: viewer phải là chính company user (owner-only). Trả NULL nếu
--    role != company hoặc không khớp.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_active_jobs INT;
    v_total_apps INT;
    v_apps_this_month INT;
    v_hires_total INT;
    v_recent_jobs JSONB;
    v_recent_apps JSONB;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN NULL;
    END IF;

    -- Stats
    SELECT COUNT(*)::INT
      INTO v_active_jobs
      FROM public.jobs j
     WHERE j.company_user_id = v_me
       AND j.status = 'active'
       AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT
      INTO v_total_apps
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me
       AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT
      INTO v_apps_this_month
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me
       AND j.deleted_at IS NULL
       AND a.applied_at >= date_trunc('month', NOW());

    SELECT COUNT(*)::INT
      INTO v_hires_total
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me
       AND j.deleted_at IS NULL
       AND a.status = 'hired';

    -- Recent jobs (5)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'status', x.status,
            'createdAt', x.created_at,
            'expiresAt', x.expires_at,
            'applicantCount', x.applicant_count
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_jobs
    FROM (
        SELECT j.id, j.title, j.status, j.created_at, j.expires_at,
               COALESCE((
                   SELECT COUNT(*)::INT FROM public.job_applications a
                    WHERE a.job_id = j.id
               ), 0) AS applicant_count
          FROM public.jobs j
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
         ORDER BY j.created_at DESC
         LIMIT 5
    ) x;

    -- Recent applicants (5)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'applicationId', x.application_id,
            'applicantId', x.applicant_id,
            'displayName', x.display_name,
            'avatarUrl', x.avatar_url,
            'headline', x.headline,
            'jobId', x.job_id,
            'jobTitle', x.job_title,
            'status', x.status,
            'appliedAt', x.applied_at
        ) ORDER BY x.applied_at DESC
    ), '[]'::jsonb)
    INTO v_recent_apps
    FROM (
        SELECT a.id AS application_id,
               a.applicant_id,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline,
               j.id AS job_id,
               j.title AS job_title,
               a.status,
               a.applied_at
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
         ORDER BY a.applied_at DESC
         LIMIT 5
    ) x;

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'activeJobs', v_active_jobs,
            'totalApplications', v_total_apps,
            'applicationsThisMonth', v_apps_this_month,
            'hireRate', CASE
                WHEN v_total_apps > 0
                THEN ROUND((v_hires_total::NUMERIC / v_total_apps) * 100, 1)
                ELSE 0
            END
        ),
        'recentJobs', v_recent_jobs,
        'recentApplicants', v_recent_apps
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_dashboard_overview() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: get_company_jobs
--    Filter: status ('all'|'active'|'draft'|'closed'|'expired'), search (ILIKE
--    trên title). Phân trang offset/limit (đủ cho dashboard, không cần cursor).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_jobs(
    p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
    v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT j.*
          FROM public.jobs j
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
           AND (p_status = 'all' OR j.status = p_status)
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (
        SELECT COUNT(*)::INT AS total FROM base
    ),
    page AS (
        SELECT b.id, b.title, b.status, b.created_at, b.expires_at,
               COALESCE((
                   SELECT COUNT(*)::INT FROM public.job_applications a
                    WHERE a.job_id = b.id
               ), 0) AS applicant_count
          FROM base b
         ORDER BY b.created_at DESC
         LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'status', p.status,
            'createdAt', p.created_at,
            'expiresAt', p.expires_at,
            'applicantCount', p.applicant_count
        ) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_jobs(TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: get_company_applicants
--    Filter: job_id (optional), status (optional, 'all' để bỏ qua), search.
--    Trả thêm thông tin job_title để hiển thị inline.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_applicants(
    p_job_id BIGINT DEFAULT NULL,
    p_status TEXT DEFAULT 'all',
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
    v_q TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 50), 200), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT a.id AS application_id,
               a.applicant_id,
               a.status,
               a.applied_at,
               a.cover_letter,
               a.resume_url,
               j.id AS job_id,
               j.title AS job_title,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
           AND (p_job_id IS NULL OR a.job_id = p_job_id)
           AND (p_status = 'all' OR a.status = p_status)
           AND (
               v_q IS NULL
               OR COALESCE(mp.full_name, cp.name, u.email) ILIKE '%' || v_q || '%'
               OR j.title ILIKE '%' || v_q || '%'
           )
    ),
    counted AS (
        SELECT COUNT(*)::INT AS total FROM base
    ),
    page AS (
        SELECT * FROM base
         ORDER BY applied_at DESC
         LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'applicationId', p.application_id,
            'applicantId', p.applicant_id,
            'displayName', p.display_name,
            'avatarUrl', p.avatar_url,
            'headline', p.headline,
            'jobId', p.job_id,
            'jobTitle', p.job_title,
            'status', p.status,
            'appliedAt', p.applied_at,
            'coverLetter', p.cover_letter,
            'resumeUrl', p.resume_url
        ) ORDER BY p.applied_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_applicants(BIGINT, TEXT, TEXT, INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: update_application_status
--    Owner-only (chính công ty tạo job). Insert vào history bằng cùng
--    transaction. Trigger history riêng có thể có sau; tạm thời insert trực
--    tiếp để giữ atomicity.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id BIGINT,
    p_new_status TEXT,
    p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_company_user_id BIGINT;
    v_old_status TEXT;
    v_now TIMESTAMPTZ;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('applied','reviewed','interview','offered','hired','rejected','withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus');
    END IF;

    SELECT j.company_user_id, a.status
      INTO v_company_user_id, v_old_status
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE a.id = p_application_id
       AND j.deleted_at IS NULL
     LIMIT 1;

    IF v_company_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound');
    END IF;

    IF v_company_user_id <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;

    -- Withdrawn chỉ ứng viên tự đổi; recruiter không được dùng.
    IF p_new_status = 'withdrawn' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdraw');
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status);
    END IF;

    v_now := NOW();

    UPDATE public.job_applications
       SET status = p_new_status,
           updated_at = v_now
     WHERE id = p_application_id;

    INSERT INTO public.application_status_history(
        application_id, old_status, new_status, changed_by, note, changed_at
    ) VALUES (
        p_application_id, v_old_status, p_new_status, v_me,
        NULLIF(btrim(COALESCE(p_note, '')), ''), v_now
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'noop', FALSE,
        'status', p_new_status,
        'oldStatus', v_old_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_application_status(BIGINT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: update_job_status
--    Owner-only. Cho phép: draft → active, active → closed, closed → active,
--    active → draft. Không cho chỉnh sang 'expired' (do hệ thống tự set) hay
--    'removed' (soft delete riêng).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_job_status(
    p_job_id BIGINT,
    p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_company_user_id BIGINT;
    v_old_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    IF p_new_status NOT IN ('draft','active','closed') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus');
    END IF;

    SELECT j.company_user_id, j.status
      INTO v_company_user_id, v_old_status
      FROM public.jobs j
     WHERE j.id = p_job_id
       AND j.deleted_at IS NULL
     LIMIT 1;

    IF v_company_user_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;

    IF v_company_user_id <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;

    IF v_old_status = 'removed' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobRemoved');
    END IF;

    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object('ok', TRUE, 'noop', TRUE, 'status', v_old_status);
    END IF;

    UPDATE public.jobs
       SET status = p_new_status,
           updated_at = NOW()
     WHERE id = p_job_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'noop', FALSE,
        'status', p_new_status,
        'oldStatus', v_old_status
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_status(BIGINT, TEXT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260527_017
-- =============================================================================


-- #############################################################################
-- 21. JOBS & APPLICATIONS — candidate-facing RPCs (M05)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260527_018 — JOBS (M05 candidate-facing) + APPLICATIONS
-- =============================================================================
-- Mục tiêu:
--   • Index hot path cho job listing + ILIKE search title.
--   • RPCs:
--       - create_job()            → recruiter đăng tin (kèm skills)
--       - get_jobs_list()         → list/search có filter cho ứng viên
--       - get_job_detail()        → 1 round-trip cho /jobs/[id]
--       - apply_to_job()          → member ứng tuyển + notify recruiter
--       - withdraw_application()  → member rút đơn
--       - toggle_saved_job()      → member bookmark/unbookmark
--       - get_my_saved_jobs()     → list bookmarks của member
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Index hot path
-- -----------------------------------------------------------------------------
-- ILIKE trên title cho search. pg_trgm đã enable ở migration network_perf.
CREATE INDEX IF NOT EXISTS idx_jobs_title_trgm
    ON public.jobs USING gin (title gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Sort hot path: status='active' + created_at DESC. Đã có idx_jobs_active_company
-- nhưng thiếu created_at — thêm partial.
CREATE INDEX IF NOT EXISTS idx_jobs_active_created
    ON public.jobs(created_at DESC)
    WHERE status = 'active' AND deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. RPC: create_job
--    Recruiter only. Skills truyền theo tên (array). RPC sẽ find-or-create
--    rows trong public.skills rồi insert job_skills.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_job(
    p_title TEXT,
    p_description TEXT,
    p_requirements TEXT,
    p_province_id BIGINT,
    p_district_id BIGINT,
    p_salary_min BIGINT,
    p_salary_max BIGINT,
    p_salary_visible BOOLEAN,
    p_job_type_id BIGINT,
    p_work_mode_id BIGINT,
    p_job_position_id BIGINT,
    p_status TEXT,
    p_expires_at TIMESTAMPTZ,
    p_skills TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_status TEXT;
    v_job_id BIGINT;
    v_skill_name TEXT;
    v_skill_id BIGINT;
BEGIN
    SELECT u.id, u.role, u.status INTO v_me, v_role, v_status
      FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'company' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany');
    END IF;
    IF v_status <> 'active' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyInactive');
    END IF;

    -- Validate cơ bản (RPC server-side, khớp với client zod).
    IF btrim(COALESCE(p_title, '')) = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidTitle');
    END IF;
    IF char_length(btrim(p_title)) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'titleTooLong');
    END IF;
    IF btrim(COALESCE(p_description, '')) = '' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDescription');
    END IF;
    IF p_salary_min IS NOT NULL AND p_salary_max IS NOT NULL
       AND p_salary_min > p_salary_max THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidSalaryRange');
    END IF;
    IF p_status NOT IN ('draft', 'active') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidStatus');
    END IF;

    -- FK guards: tránh insert lỗi.
    IF NOT EXISTS(SELECT 1 FROM public.job_types WHERE id = p_job_type_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidJobType');
    END IF;
    IF NOT EXISTS(SELECT 1 FROM public.work_modes WHERE id = p_work_mode_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidWorkMode');
    END IF;
    IF p_province_id IS NOT NULL
       AND NOT EXISTS(SELECT 1 FROM public.provinces WHERE id = p_province_id) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidProvince');
    END IF;

    INSERT INTO public.jobs(
        company_user_id, title, description, requirements,
        province_id, district_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, status, expires_at
    ) VALUES (
        v_me,
        btrim(p_title),
        btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_district_id, p_salary_min, p_salary_max,
        COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, p_status, p_expires_at
    )
    RETURNING id INTO v_job_id;

    -- Skills: find-or-create theo name (case-sensitive UNIQUE), bỏ qua duplicate.
    IF p_skills IS NOT NULL THEN
        FOREACH v_skill_name IN ARRAY p_skills LOOP
            v_skill_name := btrim(v_skill_name);
            CONTINUE WHEN v_skill_name = '' OR char_length(v_skill_name) > 100;

            SELECT id INTO v_skill_id FROM public.skills
             WHERE name = v_skill_name LIMIT 1;

            IF v_skill_id IS NULL THEN
                INSERT INTO public.skills(name) VALUES (v_skill_name)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING id INTO v_skill_id;
            END IF;

            INSERT INTO public.job_skills(job_id, skill_id, is_required)
            VALUES (v_job_id, v_skill_id, TRUE)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'jobId', v_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_job(
    TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN,
    BIGINT, BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: get_jobs_list
--    Public job board. Filter: search (ILIKE title), province, job types,
--    work modes, salary range. Pagination offset/limit. Trả thêm
--    viewerSaved/viewerApplied để UI hiển thị state đúng.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_jobs_list(
    p_search TEXT DEFAULT NULL,
    p_province_id BIGINT DEFAULT NULL,
    p_job_type_ids BIGINT[] DEFAULT NULL,
    p_work_mode_ids BIGINT[] DEFAULT NULL,
    p_salary_min BIGINT DEFAULT NULL,
    p_company_user_id BIGINT DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
    v_q TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               j.created_at, j.expires_at,
               j.company_user_id,
               j.province_id, j.district_id,
               j.job_type_id, j.work_mode_id,
               pv.name AS province_name,
               dt.name AS district_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name,
               COALESCE(cp.name, u.email) AS company_name,
               cp.logo_url AS company_logo_url,
               cp.verification_status AS company_verification_status
          FROM public.jobs j
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.districts dt ON dt.id = j.district_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE j.status = 'active'
           AND j.deleted_at IS NULL
           AND (j.expires_at IS NULL OR j.expires_at > NOW())
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
           AND (p_province_id IS NULL OR j.province_id = p_province_id)
           AND (p_job_type_ids IS NULL OR j.job_type_id = ANY(p_job_type_ids))
           AND (p_work_mode_ids IS NULL OR j.work_mode_id = ANY(p_work_mode_ids))
           AND (p_salary_min IS NULL OR COALESCE(j.salary_max, j.salary_min) >= p_salary_min)
           AND (p_company_user_id IS NULL OR j.company_user_id = p_company_user_id)
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT * FROM base
         ORDER BY created_at DESC
         LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'salaryMin', p.salary_min,
            'salaryMax', p.salary_max,
            'salaryVisible', p.salary_visible,
            'createdAt', p.created_at,
            'expiresAt', p.expires_at,
            'companyUserId', p.company_user_id,
            'companyName', p.company_name,
            'companyLogoUrl', p.company_logo_url,
            'companyVerified', p.company_verification_status = 'verified',
            'provinceName', p.province_name,
            'districtName', p.district_name,
            'jobTypeName', p.job_type_name,
            'workModeName', p.work_mode_name,
            'viewerSaved', v_me IS NOT NULL AND EXISTS(
                SELECT 1 FROM public.saved_jobs s
                 WHERE s.user_id = v_me AND s.job_id = p.id
            ),
            'viewerApplied', v_me IS NOT NULL AND EXISTS(
                SELECT 1 FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p.id
            )
        ) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_jobs_list(
    TEXT, BIGINT, BIGINT[], BIGINT[], BIGINT, BIGINT, INT, INT
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC: get_job_detail
--    1 round-trip cho trang /jobs/[id]: job core, company, skills, viewer
--    state (isOwner, viewerSaved, viewerApplied, applicationStatus).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_job_detail(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_job JSONB;
    v_skills JSONB;
    v_viewer JSONB;
    v_company_user_id BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    SELECT jsonb_build_object(
        'id', j.id,
        'title', j.title,
        'description', j.description,
        'requirements', j.requirements,
        'salaryMin', j.salary_min,
        'salaryMax', j.salary_max,
        'salaryVisible', j.salary_visible,
        'status', j.status,
        'createdAt', j.created_at,
        'expiresAt', j.expires_at,
        'companyUserId', j.company_user_id,
        'companyName', COALESCE(cp.name, u.email),
        'companyLogoUrl', cp.logo_url,
        'companyIndustry', cp.industry,
        'companyAbout', cp.about,
        'companySize', cp.size,
        'companyVerified', cp.verification_status = 'verified',
        'provinceName', pv.name,
        'districtName', dt.name,
        'jobTypeName', jt.name,
        'workModeName', wm.name,
        'jobPositionName', jp.name
    ), j.company_user_id
    INTO v_job, v_company_user_id
    FROM public.jobs j
    JOIN public.users u ON u.id = j.company_user_id
    LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
    LEFT JOIN public.provinces pv ON pv.id = j.province_id
    LEFT JOIN public.districts dt ON dt.id = j.district_id
    LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
    LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
    LEFT JOIN public.job_positions jp ON jp.id = j.job_position_id
    WHERE j.id = p_job_id
      AND j.deleted_at IS NULL;

    IF v_job IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(jsonb_agg(s.name ORDER BY s.name), '[]'::jsonb)
      INTO v_skills
      FROM public.job_skills js
      JOIN public.skills s ON s.id = js.skill_id
     WHERE js.job_id = p_job_id;

    -- Viewer state
    IF v_me IS NULL THEN
        v_viewer := jsonb_build_object(
            'isOwner', FALSE,
            'viewerSaved', FALSE,
            'viewerApplied', FALSE,
            'applicationStatus', NULL,
            'applicationId', NULL
        );
    ELSE
        v_viewer := jsonb_build_object(
            'isOwner', v_me = v_company_user_id,
            'viewerSaved', EXISTS(
                SELECT 1 FROM public.saved_jobs s
                 WHERE s.user_id = v_me AND s.job_id = p_job_id
            ),
            'viewerApplied', EXISTS(
                SELECT 1 FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p_job_id
            ),
            'applicationStatus', (
                SELECT a.status FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p_job_id LIMIT 1
            ),
            'applicationId', (
                SELECT a.id FROM public.job_applications a
                 WHERE a.applicant_id = v_me AND a.job_id = p_job_id LIMIT 1
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'job', v_job,
        'skills', v_skills,
        'viewer', v_viewer
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_detail(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. RPC: apply_to_job
--    Member-only. Job phải active + chưa hết hạn. UNIQUE (job_id, applicant_id)
--    chặn nộp trùng. Insert history row vì applied là trạng thái khởi tạo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_to_job(
    p_job_id BIGINT,
    p_cover_letter TEXT,
    p_resume_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_job_status TEXT;
    v_job_expires TIMESTAMPTZ;
    v_application_id BIGINT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role
      FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'member' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly');
    END IF;

    SELECT status, expires_at INTO v_job_status, v_job_expires
      FROM public.jobs
     WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;

    IF v_job_status IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;
    IF v_job_status <> 'active' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotActive');
    END IF;
    IF v_job_expires IS NOT NULL AND v_job_expires <= NOW() THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobExpired');
    END IF;

    IF EXISTS(SELECT 1 FROM public.job_applications
               WHERE job_id = p_job_id AND applicant_id = v_me) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'alreadyApplied');
    END IF;

    IF p_cover_letter IS NOT NULL AND char_length(p_cover_letter) > 5000 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'coverLetterTooLong');
    END IF;

    INSERT INTO public.job_applications(
        job_id, applicant_id, resume_url, cover_letter, status
    ) VALUES (
        p_job_id, v_me,
        NULLIF(btrim(COALESCE(p_resume_url, '')), ''),
        NULLIF(btrim(COALESCE(p_cover_letter, '')), ''),
        'applied'
    )
    RETURNING id INTO v_application_id;

    INSERT INTO public.application_status_history(
        application_id, old_status, new_status, changed_by, note
    ) VALUES (
        v_application_id, NULL, 'applied', v_me, NULL
    );

    RETURN jsonb_build_object(
        'ok', TRUE,
        'applicationId', v_application_id,
        'status', 'applied'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_to_job(BIGINT, TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: withdraw_application
--    Member-only, chỉ chủ đơn được rút. Không cho rút khi đã 'hired' (kết quả
--    cuối) — tránh xoá nhầm trên dashboard recruiter.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.withdraw_application(p_application_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_applicant BIGINT;
    v_old_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    SELECT applicant_id, status INTO v_applicant, v_old_status
      FROM public.job_applications WHERE id = p_application_id LIMIT 1;
    IF v_applicant IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'applicationNotFound');
    END IF;
    IF v_applicant <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;
    IF v_old_status IN ('withdrawn','hired','rejected') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotWithdrawNow');
    END IF;

    UPDATE public.job_applications
       SET status = 'withdrawn', updated_at = NOW()
     WHERE id = p_application_id;

    INSERT INTO public.application_status_history(
        application_id, old_status, new_status, changed_by, note
    ) VALUES (
        p_application_id, v_old_status, 'withdrawn', v_me, NULL
    );

    RETURN jsonb_build_object('ok', TRUE, 'status', 'withdrawn');
END;
$$;

GRANT EXECUTE ON FUNCTION public.withdraw_application(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC: toggle_saved_job  (idempotent bookmark)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_saved_job(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_existing INT;
    v_saved BOOLEAN;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'member' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'memberOnly');
    END IF;

    IF NOT EXISTS(SELECT 1 FROM public.jobs
                   WHERE id = p_job_id AND deleted_at IS NULL) THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;

    SELECT 1 INTO v_existing FROM public.saved_jobs
     WHERE user_id = v_me AND job_id = p_job_id LIMIT 1;

    IF v_existing IS NOT NULL THEN
        DELETE FROM public.saved_jobs
         WHERE user_id = v_me AND job_id = p_job_id;
        v_saved := FALSE;
    ELSE
        INSERT INTO public.saved_jobs(user_id, job_id)
        VALUES (v_me, p_job_id)
        ON CONFLICT DO NOTHING;
        v_saved := TRUE;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'saved', v_saved);
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_saved_job(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC: get_my_saved_jobs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_saved_jobs(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_items JSONB;
    v_total INT;
    v_lim INT;
    v_off INT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);

    WITH base AS (
        SELECT s.created_at AS saved_at,
               j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               j.status, j.created_at AS job_created_at, j.expires_at,
               j.company_user_id,
               COALESCE(cp.name, u.email) AS company_name,
               cp.logo_url AS company_logo_url,
               pv.name AS province_name,
               dt.name AS district_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name
          FROM public.saved_jobs s
          JOIN public.jobs j ON j.id = s.job_id AND j.deleted_at IS NULL
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.districts dt ON dt.id = j.district_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE s.user_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT * FROM base ORDER BY saved_at DESC LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'salaryMin', p.salary_min,
            'salaryMax', p.salary_max,
            'salaryVisible', p.salary_visible,
            'jobStatus', p.status,
            'savedAt', p.saved_at,
            'createdAt', p.job_created_at,
            'expiresAt', p.expires_at,
            'companyUserId', p.company_user_id,
            'companyName', p.company_name,
            'companyLogoUrl', p.company_logo_url,
            'provinceName', p.province_name,
            'districtName', p.district_name,
            'jobTypeName', p.job_type_name,
            'workModeName', p.work_mode_name
        ) ORDER BY p.saved_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_saved_jobs(INT, INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260527_018
-- =============================================================================


-- #############################################################################
-- 21b. COMPANY PHONE — add column + get_company_public_overview (final, with phone)
-- #############################################################################
-- =============================================================================
-- JOBLINK MIGRATION 20260528_021 — COMPANY PHONE + PUBLIC OVERVIEW PHONE
-- =============================================================================
-- Mục tiêu:
--   • Thêm cột `phone` cho company_profiles (số điện thoại liên hệ doanh nghiệp).
--   • Cập nhật RPC `get_company_public_overview` để trả thêm `phone` cho trang
--     public + view hồ sơ công ty.
-- Lưu ý: bảng follows, RLS follows, RPC toggle_follow_company đã tồn tại từ
--   migration 016 — không đụng tới ở đây.
-- =============================================================================

ALTER TABLE public.company_profiles
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

-- -----------------------------------------------------------------------------
-- Recreate get_company_public_overview để thêm trường `phone`.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_company_public_overview(
    p_company_user_id BIGINT,
    p_jobs_limit INT DEFAULT 8
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_me BIGINT;
    v_company JSONB;
    v_jobs JSONB;
    v_follower_count INT;
    v_jobs_count INT;
    v_is_following BOOLEAN;
    v_jobs_lim INT;
BEGIN
    v_jobs_lim := GREATEST(LEAST(COALESCE(p_jobs_limit, 8), 50), 1);

    SELECT u.id INTO v_me
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    SELECT jsonb_build_object(
        'userId', u.id,
        'companyId', cp.id,
        'name', cp.name,
        'slug', cp.slug,
        'logoUrl', cp.logo_url,
        'about', cp.about,
        'website', cp.website,
        'phone', cp.phone,
        'industry', cp.industry,
        'size', cp.size,
        'openToHire', cp.open_to_hire,
        'verificationStatus', cp.verification_status,
        'provinceName', pv.name,
        'districtName', dt.name,
        'businessAddress', cp.business_address,
        'businessEmail', cp.business_email,
        'representativeName', cp.representative_name,
        'representativeTitle', cp.representative_title,
        'createdAt', cp.created_at
    )
    INTO v_company
    FROM public.users u
    JOIN public.company_profiles cp
      ON cp.user_id = u.id AND cp.deleted_at IS NULL
    LEFT JOIN public.provinces pv ON pv.id = cp.province_id
    LEFT JOIN public.districts dt ON dt.id = cp.district_id
    WHERE u.id = p_company_user_id
      AND u.deleted_at IS NULL
      AND u.role = 'company'
      AND u.status = 'active';

    IF v_company IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COUNT(*)::INT
      INTO v_jobs_count
      FROM public.jobs j
     WHERE j.company_user_id = p_company_user_id
       AND j.status = 'active'
       AND j.deleted_at IS NULL
       AND (j.expires_at IS NULL OR j.expires_at > NOW());

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'salaryMin', x.salary_min,
            'salaryMax', x.salary_max,
            'salaryVisible', x.salary_visible,
            'provinceName', x.province_name,
            'districtName', x.district_name,
            'jobTypeName', x.job_type_name,
            'workModeName', x.work_mode_name,
            'createdAt', x.created_at
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_jobs
    FROM (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               pv.name AS province_name,
               dt.name AS district_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name,
               j.created_at
          FROM public.jobs j
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.districts dt ON dt.id = j.district_id
          LEFT JOIN public.job_types jt ON jt.id = j.job_type_id
          LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
         WHERE j.company_user_id = p_company_user_id
           AND j.status = 'active'
           AND j.deleted_at IS NULL
           AND (j.expires_at IS NULL OR j.expires_at > NOW())
         ORDER BY j.created_at DESC
         LIMIT v_jobs_lim
    ) x;

    SELECT COUNT(*)::INT
      INTO v_follower_count
      FROM public.follows f
     WHERE f.followable_type = 'company'
       AND f.followable_id = p_company_user_id;

    IF v_me IS NULL OR v_me = p_company_user_id THEN
        v_is_following := FALSE;
    ELSE
        SELECT EXISTS(
            SELECT 1 FROM public.follows f
             WHERE f.follower_id = v_me
               AND f.followable_type = 'company'
               AND f.followable_id = p_company_user_id
        ) INTO v_is_following;
    END IF;

    RETURN jsonb_build_object(
        'company', v_company,
        'jobsCount', v_jobs_count,
        'followerCount', v_follower_count,
        'isFollowing', COALESCE(v_is_following, FALSE),
        'isOwner', COALESCE(v_me = p_company_user_id, FALSE),
        'jobs', v_jobs
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_public_overview(BIGINT, INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260528_021
-- =============================================================================


-- #############################################################################
-- 22. ADMIN MODULE — get_admin_dashboard + v_admin_audit_log (M12)
-- #############################################################################
-- =============================================================================
-- Admin module — single-roundtrip dashboard RPC
-- Idempotent. Re-runnable safely.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_caller_role TEXT;
    v_seven_days  TIMESTAMPTZ := NOW() - INTERVAL '7 days';
    v_stats       JSONB;
    v_role_dist   JSONB;
    v_status_dist JSONB;
    v_verif_dist  JSONB;
    v_recent_acts JSONB;
BEGIN
    SELECT u.role INTO v_caller_role
      FROM public.users u
     WHERE u.auth_id = auth.uid()
       AND u.deleted_at IS NULL
     LIMIT 1;

    IF v_caller_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'totalUsers',         (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL),
        'newUsers7d',         (SELECT COUNT(*)::INT FROM public.users WHERE deleted_at IS NULL AND created_at >= v_seven_days),
        'totalCompanies',     (SELECT COUNT(*)::INT FROM public.users WHERE role = 'company' AND deleted_at IS NULL),
        'pendingCompanies',   (SELECT COUNT(*)::INT FROM public.company_profiles WHERE verification_status IN ('pending','pending_update') AND deleted_at IS NULL),
        'totalJobs',          (SELECT COUNT(*)::INT FROM public.jobs WHERE deleted_at IS NULL),
        'activeJobs',         (SELECT COUNT(*)::INT FROM public.jobs WHERE status = 'active' AND deleted_at IS NULL),
        'totalApplications',  (SELECT COUNT(*)::INT FROM public.job_applications),
        'pendingReports',     (SELECT COUNT(*)::INT FROM public.reports WHERE status IN ('pending','in_review')),
        'totalPosts',         (SELECT COUNT(*)::INT FROM public.posts WHERE deleted_at IS NULL AND status = 'active'),
        'totalConnections',   (SELECT COUNT(*)::INT FROM public.connections WHERE status = 'accepted')
    ) INTO v_stats;

    SELECT COALESCE(jsonb_object_agg(role, cnt), '{}'::jsonb)
      INTO v_role_dist
      FROM (
          SELECT role, COUNT(*)::INT AS cnt
            FROM public.users
           WHERE deleted_at IS NULL
           GROUP BY role
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
                 a.entity_id   AS "entityId",
                 a.reason,
                 a.created_at  AS "createdAt",
                 jsonb_build_object(
                     'id',          au.id,
                     'email',       au.email,
                     'displayName', COALESCE(mp.full_name, cp.name, au.email)
                 ) AS actor
            FROM public.audit_logs a
            LEFT JOIN public.users au           ON au.id = a.actor_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = au.id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = au.id AND cp.deleted_at IS NULL
           ORDER BY a.created_at DESC
           LIMIT 10
      ) x;

    RETURN jsonb_build_object(
        'stats',          v_stats,
        'roleDist',       v_role_dist,
        'statusDist',     v_status_dist,
        'verificationDist', v_verif_dist,
        'recentActions',  v_recent_acts
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO authenticated;

-- Optional convenience view: most-recent audit log entries with actor name
CREATE OR REPLACE VIEW public.v_admin_audit_log AS
SELECT a.id,
       a.actor_id,
       au.email AS actor_email,
       COALESCE(mp.full_name, cp.name, au.email) AS actor_name,
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
LEFT JOIN public.users au            ON au.id = a.actor_id
LEFT JOIN public.member_profiles mp  ON mp.user_id = au.id AND mp.deleted_at IS NULL
LEFT JOIN public.company_profiles cp ON cp.user_id = au.id AND cp.deleted_at IS NULL;


-- #############################################################################
-- 23. STORAGE BUCKETS & RLS — post-media + uploads (avatar/cover/post)
-- #############################################################################
-- =============================================================================
-- Storage bucket cho post media
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "authenticated users can upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-media');

CREATE POLICY "everyone can view"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'post-media');

CREATE POLICY "owner can delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-media' AND owner_id = auth.uid());
-- =============================================================================
-- Storage: tách sang bucket `uploads` với layout phân tầng theo thời gian / user
-- Path mới:  uploads/post-media/<YYYY>/<MM>/<userId>/<uuid>.<ext>
-- Giữ bucket `post-media` cũ để URL ảnh đã đăng vẫn truy cập được (read-only).
-- =============================================================================

-- 1. Bucket --------------------------------------------------------------------
-- ON CONFLICT DO UPDATE: nếu bucket đã tồn tại (vd: bị tạo nháp qua dashboard
-- với public=false), migration vẫn ép về đúng cấu hình. Đây là nguyên nhân
-- phổ biến gây lỗi "khung ảnh trống" — bucket private khiến URL public 400.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  TRUE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS policies --------------------------------------------------------------
-- Authenticated user chỉ được ghi vào folder của chính mình:
--   post-media/<YYYY>/<MM>/<userId>/...
-- => path_tokens[1]='post-media' AND path_tokens[4] = id user trong public.users
--    (khớp với requireCurrentUser(): public.users.auth_id = auth.uid()).
-- Lưu ý: server actions chạy bằng service_role nên bypass RLS — các policy
-- này là lớp phòng thủ cho trường hợp client gọi storage trực tiếp.

DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: public read" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND path_tokens[1] = 'post-media'
    AND path_tokens[4] = (
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
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- 3. Index --------------------------------------------------------------------
-- KHÔNG CREATE INDEX ON storage.objects ở đây: trên Supabase managed, role
-- `postgres` không sở hữu storage.objects (thuộc `supabase_storage_admin`),
-- nên CREATE INDEX sẽ lỗi "must be owner of table objects".
--
-- Truy vấn theo prefix path (`name LIKE 'post-media/2026/05/<userId>/%'`) vẫn
-- nhanh nhờ các index mặc định Supabase đã tạo sẵn trên storage.objects:
--   * UNIQUE (bucket_id, name)         -- bucketid_objname
--   * (name text_pattern_ops)          -- name_prefix_search  -> prefix LIKE
--   * GIN (path_tokens)                -- tìm theo từng tầng folder
--
-- Nếu sau này thực sự cần partial index riêng cho bucket `uploads`, tạo qua
-- Supabase dashboard (chạy với quyền supabase_storage_admin) thay vì migration.
-- =============================================================================
-- JOBLINK MIGRATION 20260528_019 — Member avatar + cover upload
-- =============================================================================
-- Mục tiêu:
--   • Thêm cột cover_url cho member_profiles (ảnh bìa, kiểu LinkedIn).
--   • Cho phép authenticated upload vào hai prefix mới trên bucket `uploads`:
--       member-avatar/<YYYY>/<MM>/<userId>/<uuid>.<ext>
--       member-cover/<YYYY>/<MM>/<userId>/<uuid>.<ext>
--     (cùng cấu trúc với post-media — gom theo tháng để dễ dọn rác sau này.)
--   • Đồng bộ với migration 20260523_010: policy cũ chỉ cho path_tokens[1]='post-media',
--     ta phải DROP & CREATE lại với điều kiện ANY trong các prefix hợp lệ.
-- =============================================================================

-- 1. Schema -------------------------------------------------------------------
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT NULL;

COMMENT ON COLUMN public.member_profiles.cover_url IS
  'URL ảnh bìa hồ sơ thành viên (lưu trong storage bucket uploads, prefix member-cover/).';

-- 2. Storage RLS --------------------------------------------------------------
-- Drop policies cũ (chỉ whitelist post-media) rồi tạo lại với danh sách prefix.
DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND path_tokens[1] IN ('post-media', 'member-avatar', 'member-cover')
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "uploads: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND path_tokens[1] IN ('post-media', 'member-avatar', 'member-cover')
    AND path_tokens[4] = (
      SELECT id::text FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- =============================================================================
-- 24. SEED DATA — dữ liệu khởi tạo tối thiểu
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
