-- =============================================================================
-- JOBLINK DATABASE SCHEMA
-- PostgreSQL / Supabase
-- Charset: UTF8
-- Thiết kế theo SRS Joblink v1.0 (phiên bản đơn giản hoá 19/05/2026)
--
-- ⮕ ĐÂY LÀ SCHEMA HỢP NHẤT (AUTHORITATIVE): bao gồm toàn bộ bảng, index, trigger,
--   view, RPC, RLS, realtime và storage đã gộp từ TOÀN BỘ supabase/migrations
--   (đến 20260601_031). Xem file này thay vì đọc từng migration.
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
--   • provinces / wards — Tỉnh thành & Xã/Phường/Đặc khu (mô hình 2 cấp 2025)
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

CREATE INDEX IF NOT EXISTS idx_provinces_active     ON provinces(is_active, sort_order)     WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wards_province   ON wards(province_id)               WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wards_active     ON wards(is_active, sort_order)     WHERE deleted_at IS NULL;
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
    ward_id        BIGINT NULL,
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
    -- Kỹ năng free-text riêng từng thành viên (migration 031): không còn FK tới
    -- bảng danh mục `skills` dùng chung. `skills`/`job_skills` chỉ phục vụ tin tuyển dụng.
    name              VARCHAR(100) NOT NULL,
    endorsement_count INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_member_skill_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_member_skill_user_name UNIQUE (user_id, name)
);
COMMENT ON TABLE public.member_skills IS
  'Kỹ năng riêng từng thành viên (free-text). RLS: admin_all + view if can_view_member_profile + owner write';

CREATE TABLE IF NOT EXISTS profile_view_logs (
    id             BIGSERIAL PRIMARY KEY,
    target_user_id BIGINT NOT NULL,
    viewer_user_id BIGINT NULL,
    viewed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_pvl_target FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pvl_viewer FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS member_cvs (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL,
    file_name    VARCHAR(160) NOT NULL,
    storage_path TEXT NOT NULL,
    file_size    INT NOT NULL,
    mime_type    VARCHAR(80) NOT NULL DEFAULT 'application/pdf',
    is_default   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ NULL,
    CONSTRAINT fk_member_cv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_member_cv_size CHECK (file_size > 0 AND file_size <= 5 * 1024 * 1024),
    CONSTRAINT chk_member_cv_mime CHECK (mime_type = 'application/pdf'),
    CONSTRAINT uk_member_cv_path UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_member_profiles_user     ON member_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_otw      ON member_profiles(open_to_work) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_visibility ON member_profiles(profile_visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_profiles_province ON member_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_member_profiles_ward ON member_profiles(ward_id);
CREATE INDEX IF NOT EXISTS idx_member_experiences_user  ON member_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_member_educations_user   ON member_educations(user_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_user       ON member_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_view_target      ON profile_view_logs(target_user_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_member_cvs_user          ON member_cvs(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_member_cvs_default_per_user
    ON member_cvs(user_id) WHERE is_default = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profile_view_viewer      ON profile_view_logs(viewer_user_id, viewed_at);

-- Row Level Security cho member_cvs: owner toàn quyền, admin bypass. Company
-- KHÔNG đọc trực tiếp bảng này (xem CV ứng viên qua job_applications.resume_url).
ALTER TABLE public.member_cvs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_cvs_admin_all  ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_select_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_insert_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_update_own ON public.member_cvs;
DROP POLICY IF EXISTS member_cvs_delete_own ON public.member_cvs;

CREATE POLICY member_cvs_admin_all
  ON public.member_cvs
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY member_cvs_select_own
  ON public.member_cvs
  FOR SELECT
  USING (user_id = public.auth_user_id());

CREATE POLICY member_cvs_insert_own
  ON public.member_cvs
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY member_cvs_update_own
  ON public.member_cvs
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY member_cvs_delete_own
  ON public.member_cvs
  FOR DELETE
  USING (user_id = public.auth_user_id());

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
    ward_id            BIGINT NULL,
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

CREATE INDEX IF NOT EXISTS idx_company_profiles_verification ON company_profiles(verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_oth          ON company_profiles(open_to_hire, verification_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_profiles_slug         ON company_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_company_profiles_province     ON company_profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_company_profiles_ward     ON company_profiles(ward_id);

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
    ward_id      BIGINT NULL,
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
CREATE INDEX IF NOT EXISTS idx_jobs_ward      ON jobs(ward_id);
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

-- RLS: cho phép mọi authenticated user SELECT report_types (lookup table)
ALTER TABLE public.report_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_types_select_authenticated ON public.report_types;
CREATE POLICY report_types_select_authenticated
  ON public.report_types
  FOR SELECT
  USING (true);

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

CREATE TRIGGER trg_wards_set_updated_at
BEFORE UPDATE ON wards
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
       mp.ward_id, d.name AS ward_name,
       mp.open_to_work, mp.profile_visibility
FROM users u
JOIN member_profiles mp ON mp.user_id = u.id
LEFT JOIN provinces p ON p.id = mp.province_id
LEFT JOIN wards d ON d.id = mp.ward_id
WHERE u.role = 'member'
  AND u.status = 'active'
  AND u.deleted_at IS NULL
  AND mp.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_verified_companies AS
SELECT u.id, u.auth_id, u.email,
       cp.name, cp.slug, cp.logo_url, cp.industry, cp.size,
       cp.province_id, p.name AS province_name,
       cp.ward_id, d.name AS ward_name,
       cp.open_to_hire, cp.verified_at
FROM users u
JOIN company_profiles cp ON cp.user_id = u.id
LEFT JOIN provinces p ON p.id = cp.province_id
LEFT JOIN wards d ON d.id = cp.ward_id
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
       d.name       AS ward_name,
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
LEFT JOIN wards     d  ON d.id  = j.ward_id
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
               p.visibility, p.created_at, p.reaction_count, p.comment_count, p.share_count
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
              f.reaction_count AS \"reactionCount\",
              f.comment_count AS \"commentCount\",
              f.share_count AS \"shareCount\",
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
                      'voteCount', po.vote_count,
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
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.poll_options
       SET vote_count = vote_count + 1
     WHERE id = p_option_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_poll_vote_count(BIGINT)
    TO authenticated;


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
    p_ward_id BIGINT,
    p_salary_min BIGINT,
    p_salary_max BIGINT,
    p_salary_visible BOOLEAN,
    p_job_type_id BIGINT,
    p_work_mode_id BIGINT,
    p_job_position_id BIGINT,
    p_position_title TEXT,
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
    v_position_title TEXT;
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

    v_position_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_position_title IS NOT NULL AND char_length(v_position_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong');
    END IF;

    INSERT INTO public.jobs(
        company_user_id, title, description, requirements,
        province_id, ward_id, salary_min, salary_max, salary_visible,
        job_type_id, work_mode_id, job_position_id, position_title,
        status, expires_at
    ) VALUES (
        v_me,
        btrim(p_title),
        btrim(p_description),
        NULLIF(btrim(COALESCE(p_requirements, '')), ''),
        p_province_id, p_ward_id, p_salary_min, p_salary_max,
        COALESCE(p_salary_visible, TRUE),
        p_job_type_id, p_work_mode_id, p_job_position_id, v_position_title,
        p_status, p_expires_at
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
    BIGINT, BIGINT, BIGINT, TEXT, TEXT, TIMESTAMPTZ, TEXT[]
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
               j.province_id, j.ward_id,
               j.job_type_id, j.work_mode_id,
               pv.name AS province_name,
               dt.name AS ward_name,
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
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
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
            'wardName', p.ward_name,
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
        'wardName', dt.name,
        'jobTypeName', jt.name,
        'workModeName', wm.name,
        'jobPositionName', jp.name,
        'positionTitle', j.position_title
    ), j.company_user_id
    INTO v_job, v_company_user_id
    FROM public.jobs j
    JOIN public.users u ON u.id = j.company_user_id
    LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
    LEFT JOIN public.provinces pv ON pv.id = j.province_id
    LEFT JOIN public.wards dt ON dt.id = j.ward_id
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
               dt.name AS ward_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name
          FROM public.saved_jobs s
          JOIN public.jobs j ON j.id = s.job_id AND j.deleted_at IS NULL
          JOIN public.users u ON u.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
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
            'wardName', p.ward_name,
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
        'wardName', dt.name,
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
    LEFT JOIN public.wards dt ON dt.id = cp.ward_id
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
            'wardName', x.ward_name,
            'jobTypeName', x.job_type_name,
            'workModeName', x.work_mode_name,
            'createdAt', x.created_at
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_jobs
    FROM (
        SELECT j.id, j.title, j.salary_min, j.salary_max, j.salary_visible,
               pv.name AS province_name,
               dt.name AS ward_name,
               jt.name AS job_type_name,
               wm.name AS work_mode_name,
               j.created_at
          FROM public.jobs j
          LEFT JOIN public.provinces pv ON pv.id = j.province_id
          LEFT JOIN public.wards dt ON dt.id = j.ward_id
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

-- Đơn vị hành chính Việt Nam sau sắp xếp 2025 (mô hình 2 cấp):
--   • 34 tỉnh/thành phố trực thuộc trung ương
--   • 3.320 đơn vị cấp xã (phường / xã / đặc khu)
-- Nguồn: dữ liệu công khai zuydd/vn-geo (cập nhật 06/2025).
-- Admin có thể chỉnh sửa qua UI quản trị (M12 lookups).
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
    ('23', '00916', 'Xã Long Phụng'),
    ('13', '00917', 'Phường Duy Tiên'),
    ('18', '00918', 'Xã An Cư'),
    ('01', '00919', 'Xã Đoài Phương'),
    ('33', '00920', 'Xã Khánh Bình'),
    ('13', '00921', 'Xã Nam Trực'),
    ('32', '00922', 'Xã Vĩnh Thuận Đông'),
    ('27', '00923', 'Xã Dray Bhăng'),
    ('24', '00924', 'Xã Hoà Bình'),
    ('32', '00925', 'Xã Long Phú'),
    ('06', '00926', 'Xã Yên Lạc'),
    ('14', '00927', 'Phường Ninh Chử'),
    ('05', '00928', 'Xã Kẻ Sặt'),
    ('07', '00929', 'Xã Thạch Bình'),
    ('05', '00930', 'Xã Ninh Giang'),
    ('16', '00931', 'Xã Bình Hàng Trung'),
    ('18', '00932', 'Xã Óc Eo'),
    ('07', '00933', 'Xã Ngọc Lặc'),
    ('01', '00934', 'Phường Tây Tựu'),
    ('13', '00935', 'Xã Vũ Dương'),
    ('02', '00936', 'Xã Lương Bằng'),
    ('32', '00937', 'Phường Thới An Đông'),
    ('23', '00938', 'Xã Nghĩa Giang'),
    ('11', '00939', 'Xã Bạch Hà'),
    ('15', '00940', 'Xã Thuận Mỹ'),
    ('01', '00941', 'Phường Phú Thượng'),
    ('22', '00942', 'Xã Tân An'),
    ('03', '00943', 'Xã Phong Nha'),
    ('04', '00944', 'Xã Phú Vang'),
    ('19', '00945', 'Xã Đại Phúc'),
    ('04', '00946', 'Xã Lộc An'),
    ('24', '00947', 'Xã Bình Phú'),
    ('11', '00948', 'Xã Văn Hiến'),
    ('32', '00949', 'Xã Thạnh Quới'),
    ('32', '00950', 'Xã Châu Thành'),
    ('01', '00951', 'Xã Tam Hưng'),
    ('30', '00952', 'Xã Dầu Tiếng'),
    ('13', '00953', 'Xã Cát Thành'),
    ('02', '00954', 'Phường Đường Hào'),
    ('29', '00955', 'Xã Tân Hà - Lâm Hà'),
    ('05', '00956', 'Xã Vĩnh Lại'),
    ('08', '00957', 'Phường Yên Tử'),
    ('29', '00958', 'Xã Kiến Đức'),
    ('27', '00959', 'Phường Sông Cầu'),
    ('13', '00960', 'Xã Bình An'),
    ('33', '00961', 'Xã Khánh Lâm'),
    ('24', '00962', 'Xã Tân Lược'),
    ('24', '00963', 'Xã Nhuận Phú Tân'),
    ('12', '00964', 'Xã Hòa Tiến'),
    ('06', '00965', 'Xã Vĩnh Hưng'),
    ('15', '00966', 'Xã Rạch Kiến'),
    ('05', '00967', 'Phường Tân Hưng'),
    ('06', '00968', 'Xã Thanh Sơn'),
    ('13', '00969', 'Xã Ninh Giang'),
    ('01', '00970', 'Xã Hạ Bằng'),
    ('18', '00971', 'Xã Ngọc Chúc'),
    ('27', '00972', 'Xã Phú Hòa 2'),
    ('33', '00973', 'Xã Hưng Mỹ'),
    ('23', '00974', 'Xã Vệ Giang'),
    ('13', '00975', 'Xã Nghĩa Hưng'),
    ('10', '00976', 'Xã Trung Kênh'),
    ('07', '00977', 'Xã Yên Định'),
    ('23', '00978', 'Xã Mỏ Cày'),
    ('06', '00979', 'Xã Chân Mộng'),
    ('22', '00980', 'Xã Tân Tiến'),
    ('24', '00981', 'Xã Cái Nhum'),
    ('03', '00982', 'Phường Đồng Thuận'),
    ('24', '00983', 'Xã Phú Phụng'),
    ('16', '00984', 'Phường Thới Sơn'),
    ('28', '00985', 'Phường An Nhơn Bắc'),
    ('24', '00986', 'Xã Hương Mỹ'),
    ('04', '00987', 'Phường Phú Bài'),
    ('17', '00988', 'Phường Trần Phú'),
    ('32', '00989', 'Xã Nhu Gia'),
    ('07', '00990', 'Xã Hoằng Thanh'),
    ('02', '00991', 'Xã Đông Thụy Anh'),
    ('19', '00992', 'Xã Vô Tranh'),
    ('16', '00993', 'Phường Thường Lạc'),
    ('12', '00994', 'Xã Hà Nha'),
    ('24', '00995', 'Xã Nhị Trường'),
    ('05', '00996', 'Xã Tân Kỳ'),
    ('13', '00997', 'Xã Nam Minh'),
    ('10', '00998', 'Xã Bắc Lũng'),
    ('33', '00999', 'Xã Thới Bình'),
    ('33', '01000', 'Xã Đầm Dơi'),
    ('13', '01001', 'Phường Mỹ Lộc'),
    ('32', '01002', 'Xã Mỹ Tú'),
    ('32', '01003', 'Xã Tân Bình'),
    ('14', '01004', 'Xã Diên Điền'),
    ('06', '01005', 'Xã Tiên Lương'),
    ('05', '01006', 'Xã Kiến Thụy'),
    ('07', '01007', 'Xã Quảng Bình'),
    ('28', '01008', 'Xã An Lương'),
    ('05', '01009', 'Xã Việt Khê'),
    ('13', '01010', 'Xã Nam Lý'),
    ('18', '01011', 'Xã Hòa Hưng'),
    ('24', '01012', 'Xã Trà Ôn'),
    ('32', '01013', 'Phường Ngã Bảy'),
    ('05', '01014', 'Phường Hưng Đạo'),
    ('10', '01015', 'Phường Tân An'),
    ('32', '01016', 'Xã Trường Thành'),
    ('15', '01017', 'Xã An Ninh'),
    ('05', '01018', 'Xã Tứ Kỳ'),
    ('29', '01019', 'Phường Bắc Gia Nghĩa'),
    ('02', '01020', 'Xã Nam Cường'),
    ('32', '01021', 'Xã An Thạnh'),
    ('24', '01022', 'Xã An Định'),
    ('13', '01023', 'Xã Nam Ninh'),
    ('16', '01024', 'Xã Lương Hòa Lạc'),
    ('32', '01025', 'Phường Khánh Hòa'),
    ('13', '01026', 'Xã Phát Diệm'),
    ('24', '01027', 'Xã Giồng Trôm'),
    ('05', '01028', 'Xã Vĩnh Hải'),
    ('07', '01029', 'Phường Nam Sầm Sơn'),
    ('24', '01030', 'Xã Hưng Nhượng'),
    ('18', '01031', 'Xã Vĩnh Hòa Hưng'),
    ('17', '01032', 'Xã Nghi Xuân'),
    ('29', '01033', 'Xã Nam Thành'),
    ('32', '01034', 'Phường Trung Nhứt'),
    ('02', '01035', 'Xã Vũ Tiên'),
    ('06', '01036', 'Phường Vân Phú'),
    ('10', '01037', 'Xã Văn Môn'),
    ('11', '01038', 'Xã Quảng Châu'),
    ('18', '01039', 'Xã Ô Lâm'),
    ('04', '01040', 'Phường Phong Thái'),
    ('15', '01041', 'Phường Gia Lộc'),
    ('33', '01042', 'Xã Nguyễn Phích'),
    ('17', '01043', 'Phường Sông Trí'),
    ('33', '01044', 'Xã Nguyễn Việt Khái'),
    ('06', '01045', 'Xã Tam Dương Bắc'),
    ('24', '01046', 'Xã Đại Điền'),
    ('28', '01047', 'Xã Phú Túc'),
    ('06', '01048', 'Xã Tề Lỗ'),
    ('13', '01049', 'Xã Phong Doanh'),
    ('12', '01050', 'Phường Hội An'),
    ('28', '01051', 'Xã Ia Hrung'),
    ('28', '01052', 'Xã Ia Hrú'),
    ('02', '01053', 'Phường Thượng Hồng'),
    ('06', '01054', 'Xã Hội Thịnh'),
    ('12', '01055', 'Xã Xuân Phú'),
    ('19', '01056', 'Phường Trung Thành'),
    ('24', '01057', 'Phường Nguyệt Hóa'),
    ('02', '01058', 'Xã Phạm Ngũ Lão'),
    ('28', '01059', 'Xã Đak Đoa'),
    ('11', '01060', 'Xã Bình Minh'),
    ('02', '01061', 'Xã Đông Tiền Hải'),
    ('27', '01062', 'Xã Ea Knốp'),
    ('22', '01063', 'Phường Bảo Vinh'),
    ('15', '01064', 'Xã Mỹ Lệ'),
    ('16', '01065', 'Xã Mỹ Tịnh An'),
    ('11', '01066', 'Xã Quỳ Hợp'),
    ('27', '01067', 'Phường Cư Bao'),
    ('12', '01068', 'Xã Thu Bồn'),
    ('16', '01069', 'Xã Mỹ Đức Tây'),
    ('14', '01070', 'Xã Vĩnh Hải'),
    ('22', '01071', 'Xã Xuân Định'),
    ('08', '01072', 'Phường Vàng Danh'),
    ('03', '01073', 'Xã Bắc Trạch'),
    ('18', '01074', 'Xã Vĩnh Tuy'),
    ('11', '01075', 'Xã Quỳnh Sơn'),
    ('12', '01076', 'Phường Bàn Thạch'),
    ('06', '01077', 'Xã Cao Dương'),
    ('22', '01078', 'Xã Phú Hòa'),
    ('15', '01079', 'Xã Tân Biên'),
    ('05', '01080', 'Xã Nam Sách'),
    ('10', '01081', 'Xã Tam Đa'),
    ('24', '01082', 'Xã Cái Ngang'),
    ('11', '01083', 'Xã Hưng Nguyên Nam'),
    ('05', '01084', 'Xã Tân Minh'),
    ('02', '01085', 'Xã Vạn Xuân'),
    ('03', '01086', 'Xã Nam Gianh'),
    ('24', '01087', 'Xã Phước Mỹ Trung'),
    ('05', '01088', 'Phường Đồ Sơn'),
    ('26', '01089', 'Phường Tân Phong'),
    ('33', '01090', 'Xã Cái Đôi Vàm'),
    ('05', '01091', 'Xã Hà Bắc'),
    ('32', '01092', 'Xã Trường Xuân'),
    ('24', '01093', 'Xã Tân Xuân'),
    ('32', '01094', 'Xã Thới Lai'),
    ('04', '01095', 'Xã Vinh Lộc'),
    ('10', '01096', 'Phường Tiền Phong'),
    ('10', '01097', 'Xã Yên Trung'),
    ('04', '01098', 'Phường Kim Trà'),
    ('07', '01099', 'Xã Hoằng Lộc'),
    ('05', '01100', 'Xã Tiên Minh'),
    ('22', '01101', 'Xã Phú Riềng'),
    ('16', '01102', 'Xã Mỹ Quí'),
    ('02', '01103', 'Xã Châu Ninh'),
    ('07', '01104', 'Xã Xuân Lập'),
    ('03', '01105', 'Xã Quảng Ninh'),
    ('13', '01106', 'Phường Vị Khê'),
    ('22', '01107', 'Phường Bình Lộc'),
    ('30', '01108', 'Xã Hòa Hội'),
    ('05', '01109', 'Xã Thanh Hà'),
    ('29', '01110', 'Phường Xuân Trường - Đà Lạt'),
    ('13', '01111', 'Xã Vĩnh Trụ'),
    ('22', '01112', 'Xã Tân Khai'),
    ('16', '01113', 'Xã Bình Ninh'),
    ('16', '01114', 'Phường Gò Công'),
    ('23', '01115', 'Xã Lân Phong'),
    ('23', '01116', 'Xã Đăk Hà'),
    ('23', '01117', 'Xã Đình Cương'),
    ('32', '01118', 'Phường Vị Tân'),
    ('06', '01119', 'Xã Sơn Đông'),
    ('18', '01120', 'Xã Tân Thạnh'),
    ('24', '01121', 'Phường Cái Vồn'),
    ('28', '01122', 'Xã Tuy Phước Tây'),
    ('15', '01123', 'Xã Tầm Vu'),
    ('05', '01124', 'Xã Trần Phú'),
    ('05', '01125', 'Phường Trần Hưng Đạo'),
    ('24', '01126', 'Phường Bến Tre'),
    ('06', '01127', 'Xã Kim Bôi'),
    ('13', '01128', 'Xã Yên Đồng'),
    ('23', '01129', 'Xã Mộ Đức'),
    ('22', '01130', 'Phường Đồng Xoài'),
    ('04', '01131', 'Phường Hương An'),
    ('16', '01132', 'Xã Long Khánh'),
    ('15', '01133', 'Xã Dương Minh Châu'),
    ('32', '01134', 'Phường Long Mỹ'),
    ('13', '01135', 'Xã Vạn Thắng'),
    ('32', '01136', 'Xã Tân Thạnh'),
    ('13', '01137', 'Phường Hồng Quang'),
    ('11', '01138', 'Xã Giai Lạc'),
    ('16', '01139', 'Xã Mỹ Thành'),
    ('16', '01140', 'Xã Hiệp Đức'),
    ('33', '01141', 'Xã Biển Bạch'),
    ('29', '01142', 'Xã Nam Dong'),
    ('15', '01143', 'Xã Hoà Khánh'),
    ('32', '01144', 'Phường Tân Lộc'),
    ('03', '01145', 'Xã Trường Ninh'),
    ('18', '01146', 'Xã An Minh'),
    ('24', '01147', 'Xã Trung Thành'),
    ('22', '01148', 'Xã Đồng Tâm'),
    ('14', '01149', 'Xã Phước Hữu'),
    ('02', '01150', 'Xã Quỳnh An'),
    ('11', '01151', 'Xã Quỳnh Tam'),
    ('02', '01152', 'Xã Thư Vũ'),
    ('22', '01153', 'Phường An Lộc'),
    ('22', '01154', 'Xã Tân Hưng'),
    ('12', '01155', 'Xã Tây Hồ'),
    ('32', '01156', 'Xã Tân Long'),
    ('24', '01157', 'Xã Cầu Kè'),
    ('30', '01158', 'Xã Bình Khánh'),
    ('33', '01159', 'Xã Tân Thuận'),
    ('33', '01160', 'Xã Tân Lộc'),
    ('07', '01161', 'Xã Trung Chính'),
    ('13', '01162', 'Xã Yên Mô'),
    ('24', '01163', 'Xã Đồng Khởi'),
    ('23', '01164', 'Xã Bờ Y'),
    ('24', '01165', 'Xã Tân Phú'),
    ('10', '01166', 'Xã Tân Dĩnh'),
    ('33', '01167', 'Xã Phan Ngọc Hiển'),
    ('14', '01168', 'Xã Phước Dinh'),
    ('02', '01169', 'Xã Chí Minh'),
    ('18', '01170', 'Xã Cần Đăng'),
    ('13', '01171', 'Xã Bình Lục'),
    ('33', '01172', 'Xã Tân Hưng'),
    ('23', '01173', 'Xã Đăk Tô'),
    ('29', '01174', 'Xã Hàm Tân'),
    ('01', '01175', 'Xã Suối Hai'),
    ('02', '01176', 'Xã Việt Tiến'),
    ('24', '01177', 'Phường Thanh Đức'),
    ('09', '01178', 'Xã Thác Bà'),
    ('05', '01179', 'Xã An Phú'),
    ('15', '01180', 'Xã Bình Đức'),
    ('24', '01181', 'Xã Thành Thới'),
    ('22', '01182', 'Xã Thiện Hưng'),
    ('28', '01183', 'Xã Hoài Ân'),
    ('06', '01184', 'Xã Liên Châu'),
    ('06', '01185', 'Xã Vĩnh Thành'),
    ('13', '01186', 'Xã Tân Minh'),
    ('24', '01187', 'Xã Nhơn Phú'),
    ('27', '01188', 'Xã Ea Tul'),
    ('18', '01189', 'Phường Tịnh Biên'),
    ('27', '01190', 'Xã Phú Xuân'),
    ('06', '01191', 'Xã Tam Đảo'),
    ('10', '01192', 'Phường Đào Viên'),
    ('02', '01193', 'Xã Nghĩa Dân'),
    ('17', '01194', 'Xã Cổ Đạm'),
    ('24', '01195', 'Xã Nhị Long'),
    ('32', '01196', 'Xã Trường Khánh'),
    ('16', '01197', 'Xã Bình Trưng'),
    ('06', '01198', 'Xã Lập Thạch'),
    ('32', '01199', 'Phường Đại Thành'),
    ('29', '01200', 'Xã Quảng Tín'),
    ('10', '01201', 'Phường Trí Quả'),
    ('05', '01202', 'Xã Vĩnh Am'),
    ('05', '01203', 'Xã Cẩm Giang'),
    ('32', '01204', 'Xã Tài Văn'),
    ('13', '01205', 'Phường Đồng Văn'),
    ('24', '01206', 'Xã Trung Hiệp'),
    ('05', '01207', 'Phường Thạch Khôi'),
    ('13', '01208', 'Phường Đông Hoa Lư'),
    ('07', '01209', 'Phường Nguyệt Viên'),
    ('07', '01210', 'Xã Thọ Xuân'),
    ('05', '01211', 'Xã Đường An'),
    ('24', '01212', 'Xã Hiếu Thành'),
    ('10', '01213', 'Phường Tân Tiến'),
    ('06', '01214', 'Xã Sông Lô'),
    ('10', '01215', 'Xã Liên Bão'),
    ('30', '01216', 'Xã Bình Giã'),
    ('24', '01217', 'Phường Bình Minh'),
    ('24', '01218', 'Phường Sơn Đông'),
    ('05', '01219', 'Xã Hà Tây'),
    ('12', '01220', 'Phường An Thắng'),
    ('27', '01221', 'Xã Ea Ning'),
    ('03', '01222', 'Xã Đông Trạch'),
    ('06', '01223', 'Xã Nguyệt Đức'),
    ('22', '01224', 'Xã Tà Lài'),
    ('24', '01225', 'Xã Tiểu Cần'),
    ('13', '01226', 'Xã Nam Xang'),
    ('16', '01227', 'Xã Tân Hòa'),
    ('22', '01228', 'Phường Minh Hưng'),
    ('12', '01229', 'Xã Quế Sơn'),
    ('28', '01230', 'Xã Bình An'),
    ('16', '01231', 'Phường Cai Lậy'),
    ('09', '01232', 'Xã Bảo Hà'),
    ('05', '01233', 'Xã Cẩm Giàng'),
    ('33', '01234', 'Xã Tân Tiến'),
    ('17', '01235', 'Xã Cẩm Xuyên'),
    ('11', '01236', 'Xã Bích Hào'),
    ('30', '01237', 'Phường Tân Thành'),
    ('32', '01238', 'Xã Phương Bình'),
    ('05', '01239', 'Xã An Khánh'),
    ('22', '01240', 'Xã Phú Nghĩa'),
    ('11', '01241', 'Phường Tân Mai'),
    ('28', '01242', 'Xã Chư Prông'),
    ('24', '01243', 'Xã Bình Đại'),
    ('07', '01244', 'Xã Hoằng Châu'),
    ('05', '01245', 'Xã Nguyễn Lương Bằng'),
    ('16', '01246', 'Xã Chợ Gạo'),
    ('05', '01247', 'Xã Khúc Thừa Dụ'),
    ('16', '01248', 'Xã Mỹ Lợi'),
    ('13', '01249', 'Xã Giao Ninh'),
    ('07', '01250', 'Xã Thiệu Quang'),
    ('07', '01251', 'Phường Hải Bình'),
    ('06', '01252', 'Xã Bản Nguyên'),
    ('24', '01253', 'Phường Long Đức'),
    ('34', '01254', 'Xã Bắc Quang'),
    ('07', '01255', 'Xã Quảng Ngọc'),
    ('32', '01256', 'Xã Long Hưng'),
    ('28', '01257', 'Xã Cát Tiến'),
    ('12', '01258', 'Phường Hương Trà'),
    ('13', '01259', 'Xã Hải Thịnh'),
    ('29', '01260', 'Xã D''Ran'),
    ('32', '01261', 'Xã Hiệp Hưng'),
    ('18', '01262', 'Phường Tân Châu'),
    ('05', '01263', 'Xã Yết Kiêu'),
    ('05', '01264', 'Xã Hà Đông'),
    ('07', '01265', 'Xã Thường Xuân'),
    ('32', '01266', 'Xã Phụng Hiệp'),
    ('08', '01267', 'Phường Hiệp Hòa'),
    ('33', '01268', 'Xã Phú Tân'),
    ('28', '01269', 'Xã Chư Pưh'),
    ('30', '01270', 'Xã Kim Long'),
    ('13', '01271', 'Phường Châu Sơn'),
    ('13', '01272', 'Phường Hà Nam'),
    ('22', '01273', 'Xã Thanh Sơn'),
    ('16', '01274', 'Phường An Bình'),
    ('13', '01275', 'Xã Minh Thái'),
    ('32', '01276', 'Xã Phú Tâm'),
    ('07', '01277', 'Xã Hậu Lộc'),
    ('22', '01278', 'Xã La Ngà'),
    ('12', '01279', 'Xã Quế Sơn Trung'),
    ('33', '01280', 'Xã Đất Mũi'),
    ('27', '01281', 'Xã Ea M’Droh'),
    ('13', '01282', 'Xã Bình Mỹ'),
    ('05', '01283', 'Xã Nam Thanh Miện'),
    ('03', '01284', 'Xã Bố Trạch'),
    ('14', '01285', 'Phường Đô Vinh'),
    ('13', '01286', 'Xã Nho Quan'),
    ('18', '01287', 'Xã Phú Lâm'),
    ('33', '01288', 'Xã Tạ An Khương'),
    ('29', '01289', 'Xã Đức An'),
    ('22', '01290', 'Phường Phước Long'),
    ('10', '01291', 'Xã Nhã Nam'),
    ('07', '01292', 'Xã Lam Sơn'),
    ('34', '01293', 'Phường Hà Giang 2'),
    ('16', '01294', 'Xã Thanh Mỹ'),
    ('29', '01295', 'Xã Bảo Lâm 2'),
    ('07', '01296', 'Xã Hợp Tiến'),
    ('11', '01297', 'Xã Tân Châu'),
    ('31', '01298', 'Xã Yên Châu'),
    ('14', '01299', 'Phường Cam Linh'),
    ('18', '01300', 'Phường Thới Sơn'),
    ('18', '01301', 'Xã Vĩnh An'),
    ('24', '01302', 'Xã Tân An'),
    ('17', '01303', 'Xã Thiên Cầm'),
    ('02', '01304', 'Xã Hoàn Long'),
    ('33', '01305', 'Xã U Minh'),
    ('13', '01306', 'Xã Quỹ Nhất'),
    ('11', '01307', 'Xã Tân Kỳ'),
    ('07', '01308', 'Phường Nghi Sơn'),
    ('32', '01309', 'Xã Hòa An'),
    ('05', '01310', 'Xã Bình Giang'),
    ('29', '01311', 'Xã Bảo Lâm 3'),
    ('22', '01312', 'Xã Nghĩa Trung'),
    ('13', '01313', 'Xã Ninh Cường'),
    ('06', '01314', 'Xã Vĩnh An'),
    ('15', '01315', 'Xã Hiệp Hoà'),
    ('08', '01316', 'Phường Liên Hòa'),
    ('08', '01317', 'Phường Cao Xanh'),
    ('07', '01318', 'Phường Quang Trung'),
    ('02', '01319', 'Xã Tiên La'),
    ('09', '01320', 'Xã Bảo Thắng'),
    ('03', '01321', 'Phường Bắc Gianh'),
    ('29', '01322', 'Xã Hàm Thuận Nam'),
    ('32', '01323', 'Phường Vị Thanh'),
    ('05', '01324', 'Xã Hồng Châu'),
    ('02', '01325', 'Xã Đại Đồng'),
    ('29', '01326', 'Xã Nam Ban - Lâm Hà'),
    ('31', '01327', 'Xã Mường La'),
    ('06', '01328', 'Xã Tiên Lữ'),
    ('28', '01329', 'Phường Hoài Nhơn Nam'),
    ('17', '01330', 'Xã Kỳ Anh'),
    ('15', '01331', 'Xã Long Cang'),
    ('05', '01332', 'Xã Chí Minh'),
    ('24', '01333', 'Xã Tam Bình'),
    ('03', '01334', 'Xã Nam Trạch'),
    ('04', '01335', 'Xã Hưng Lộc'),
    ('16', '01336', 'Phường Bình Xuân'),
    ('06', '01337', 'Xã Bình Xuyên'),
    ('07', '01338', 'Xã Hoằng Giang'),
    ('06', '01339', 'Phường Phong Châu'),
    ('15', '01340', 'Xã Hảo Đước'),
    ('13', '01341', 'Xã Bình Sơn'),
    ('10', '01342', 'Xã Lâm Thao'),
    ('24', '01343', 'Xã Long Hiệp'),
    ('18', '01344', 'Xã Vĩnh Trạch'),
    ('23', '01345', 'Phường Sa Huỳnh'),
    ('03', '01346', 'Phường Đồng Sơn'),
    ('32', '01347', 'Xã Vị Thủy'),
    ('13', '01348', 'Phường Lê Hồ'),
    ('27', '01349', 'Xã Cư M’gar'),
    ('02', '01350', 'Xã Hiệp Cường'),
    ('14', '01351', 'Xã Bắc Ninh Hòa'),
    ('24', '01352', 'Xã Ngũ Lạc'),
    ('15', '01353', 'Phường Tân An'),
    ('29', '01354', 'Đặc khu Phú Quý'),
    ('12', '01355', 'Xã Duy Xuyên'),
    ('22', '01356', 'Xã Lộc Ninh'),
    ('13', '01357', 'Xã Lý Nhân'),
    ('16', '01358', 'Xã Bình Thành'),
    ('06', '01359', 'Xã Đào Xá'),
    ('07', '01360', 'Xã Thiệu Trung'),
    ('11', '01361', 'Xã Hoa Quân'),
    ('12', '01362', 'Xã Chiên Đàn'),
    ('22', '01363', 'Xã Bù Đăng'),
    ('12', '01364', 'Xã Duy Nghĩa'),
    ('16', '01365', 'Xã Tân Thới'),
    ('24', '01366', 'Phường Tân Hạnh'),
    ('18', '01367', 'Xã Ba Chúc'),
    ('24', '01368', 'Xã Đôn Châu'),
    ('32', '01369', 'Xã Lâm Tân'),
    ('14', '01370', 'Xã Ninh Sơn'),
    ('08', '01371', 'Phường Hoàng Quế'),
    ('05', '01372', 'Phường Chí Linh'),
    ('07', '01373', 'Xã Biện Thượng'),
    ('13', '01374', 'Xã Yên Từ'),
    ('29', '01375', 'Xã Hòa Ninh'),
    ('07', '01376', 'Xã Cẩm Thạch'),
    ('06', '01377', 'Xã Liên Sơn'),
    ('10', '01378', 'Xã Lương Tài'),
    ('24', '01379', 'Xã Tập Ngãi'),
    ('13', '01380', 'Xã Nam Hồng'),
    ('13', '01381', 'Phường Đông A'),
    ('24', '01382', 'Xã Tiên Thủy'),
    ('29', '01383', 'Xã Tuy Đức'),
    ('10', '01384', 'Phường Song Liễu'),
    ('22', '01385', 'Xã Đa Kia'),
    ('03', '01386', 'Xã Gio Linh'),
    ('05', '01387', 'Xã Trường Tân'),
    ('32', '01388', 'Xã Thới An Hội'),
    ('15', '01389', 'Xã Đức Lập'),
    ('14', '01390', 'Phường Ba Ngòi'),
    ('18', '01391', 'Xã Hòa Thuận'),
    ('04', '01392', 'Phường Dương Nỗ'),
    ('32', '01393', 'Xã Vĩnh Tường'),
    ('28', '01394', 'Phường An Nhơn Nam'),
    ('02', '01395', 'Xã Nguyễn Trãi'),
    ('14', '01396', 'Xã Vạn Thắng'),
    ('02', '01397', 'Xã Hồng Quang'),
    ('29', '01398', 'Xã Đắk Mil'),
    ('34', '01399', 'Xã Yên Sơn'),
    ('13', '01400', 'Phường Trung Sơn'),
    ('23', '01401', 'Xã Nghĩa Hành'),
    ('02', '01402', 'Xã Phụng Công'),
    ('17', '01403', 'Xã Hương Sơn'),
    ('16', '01404', 'Xã Vĩnh Kim'),
    ('15', '01405', 'Xã Phước Chỉ'),
    ('24', '01406', 'Xã Hiệp Mỹ'),
    ('30', '01407', 'Phường Long Hương'),
    ('34', '01408', 'Phường Mỹ Lâm'),
    ('29', '01409', 'Xã Hàm Kiệm'),
    ('28', '01410', 'Xã Bờ Ngoong'),
    ('03', '01411', 'Xã Quảng Trạch'),
    ('32', '01412', 'Xã Liêu Tú'),
    ('16', '01413', 'Xã Hưng Thạnh'),
    ('16', '01414', 'Xã Tân Phú'),
    ('06', '01415', 'Xã Vạn Xuân'),
    ('08', '01416', 'Phường Quảng Yên'),
    ('22', '01417', 'Xã Sông Ray'),
    ('22', '01418', 'Xã Phú Vinh'),
    ('32', '01419', 'Xã Hồ Đắc Kiện'),
    ('06', '01420', 'Xã Lâm Thao'),
    ('29', '01421', 'Xã Tân Thành'),
    ('24', '01422', 'Phường Tân Ngãi'),
    ('14', '01423', 'Xã Nam Ninh Hòa'),
    ('18', '01424', 'Xã Cô Tô'),
    ('02', '01425', 'Xã Thái Ninh'),
    ('29', '01426', 'Xã Hàm Liêm'),
    ('24', '01427', 'Xã An Hiệp'),
    ('11', '01428', 'Xã Lam Thành'),
    ('14', '01429', 'Phường Cam Ranh'),
    ('17', '01430', 'Xã Thạch Hà'),
    ('11', '01431', 'Xã Đông Lộc'),
    ('29', '01432', 'Xã Quảng Tân'),
    ('11', '01433', 'Xã Trung Lộc'),
    ('16', '01434', 'Xã Phong Mỹ'),
    ('14', '01435', 'Xã Ninh Hải'),
    ('12', '01436', 'Phường Hội An Đông'),
    ('02', '01437', 'Xã Ngự Thiên'),
    ('07', '01438', 'Xã Thọ Long'),
    ('24', '01439', 'Xã Hòa Hiệp'),
    ('13', '01440', 'Xã Bình Minh'),
    ('28', '01441', 'Xã Ia Băng'),
    ('13', '01442', 'Phường Thiên Trường'),
    ('12', '01443', 'Xã Tam Anh'),
    ('28', '01444', 'Xã Ia Pa'),
    ('19', '01445', 'Xã Đồng Hỷ'),
    ('22', '01446', 'Xã Phước Sơn'),
    ('05', '01447', 'Phường Việt Hòa'),
    ('13', '01448', 'Xã Bắc Lý'),
    ('13', '01449', 'Xã Nghĩa Lâm'),
    ('13', '01450', 'Xã Rạng Đông'),
    ('10', '01451', 'Phường Nhân Hòa'),
    ('13', '01452', 'Xã Đồng Thịnh'),
    ('29', '01453', 'Xã Đồng Kho'),
    ('18', '01454', 'Xã Hòa Lạc'),
    ('28', '01455', 'Phường An Bình'),
    ('03', '01456', 'Xã Phú Trạch'),
    ('20', '01457', 'Xã Hữu Lũng'),
    ('13', '01458', 'Phường Thành Nam'),
    ('27', '01459', 'Xã Krông Búk'),
    ('27', '01460', 'Xã Ea Hiao'),
    ('16', '01461', 'Xã Long Bình'),
    ('12', '01462', 'Phường Điện Bàn Bắc'),
    ('07', '01463', 'Xã Quảng Chính'),
    ('15', '01464', 'Xã Thạnh Bình'),
    ('27', '01465', 'Xã Ea Súp'),
    ('24', '01466', 'Xã Hàm Giang'),
    ('02', '01467', 'Xã Nam Tiên Hưng'),
    ('29', '01468', 'Xã Đạ Tẻh'),
    ('02', '01469', 'Xã Nam Tiền Hải'),
    ('24', '01470', 'Xã Tân Hào'),
    ('32', '01471', 'Xã Thạnh An'),
    ('10', '01472', 'Xã Yên Thế'),
    ('05', '01473', 'Xã Đại Sơn'),
    ('16', '01474', 'Xã Tân Thành'),
    ('27', '01475', 'Xã Hòa Thịnh'),
    ('02', '01476', 'Xã Ân Thi'),
    ('31', '01477', 'Xã Quỳnh Nhai'),
    ('07', '01478', 'Xã Cẩm Thủy'),
    ('32', '01479', 'Xã Vĩnh Thạnh'),
    ('09', '01480', 'Xã Bắc Hà'),
    ('18', '01481', 'Xã Vĩnh Thuận'),
    ('06', '01482', 'Xã Đoan Hùng'),
    ('28', '01483', 'Xã Xuân An'),
    ('02', '01484', 'Xã Đồng Châu'),
    ('02', '01485', 'Phường Sơn Nam'),
    ('05', '01486', 'Phường Tứ Minh'),
    ('26', '01487', 'Xã Tân Uyên'),
    ('10', '01488', 'Xã Quang Trung'),
    ('22', '01489', 'Xã Tân Quan'),
    ('16', '01490', 'Xã Phú Thọ'),
    ('05', '01491', 'Phường Nam Đồ Sơn'),
    ('32', '01492', 'Phường Long Phú 1'),
    ('34', '01493', 'Xã Chiêm Hoá'),
    ('07', '01494', 'Xã Đông Thành'),
    ('28', '01495', 'Xã Mang Yang'),
    ('20', '01496', 'Phường Tam Thanh'),
    ('30', '01497', 'Phường Tân Hải'),
    ('24', '01498', 'Xã Vinh Kim'),
    ('05', '01499', 'Xã An Trường'),
    ('32', '01500', 'Phường Mỹ Quới'),
    ('27', '01501', 'Xã Pơng Drang'),
    ('15', '01502', 'Xã Nhựt Tảo'),
    ('09', '01503', 'Xã Lục Yên'),
    ('07', '01504', 'Xã Hà Trung'),
    ('02', '01505', 'Xã Mễ Sở'),
    ('33', '01506', 'Xã Năm Căn'),
    ('03', '01507', 'Xã Cam Lộ'),
    ('16', '01508', 'Xã Gò Công Đông'),
    ('06', '01509', 'Xã Hải Lựu'),
    ('03', '01510', 'Xã Ninh Châu'),
    ('24', '01511', 'Xã Trà Cú'),
    ('06', '01512', 'Xã Thanh Ba'),
    ('24', '01513', 'Xã Quới Điền'),
    ('17', '01514', 'Xã Hương Khê'),
    ('15', '01515', 'Xã Tân Lân'),
    ('04', '01516', 'Phường Hương Trà'),
    ('11', '01517', 'Xã Quan Thành'),
    ('12', '01518', 'Xã Gò Nổi'),
    ('13', '01519', 'Xã Hiển Khánh'),
    ('13', '01520', 'Xã Minh Tân'),
    ('27', '01521', 'Xã Ea Khăl'),
    ('15', '01522', 'Xã Tân Phú'),
    ('33', '01523', 'Xã Trần Phán'),
    ('19', '01524', 'Phường Quyết Thắng'),
    ('06', '01525', 'Xã Bình Tuyền'),
    ('07', '01526', 'Xã Thiệu Toán'),
    ('03', '01527', 'Xã Hòa Trạch'),
    ('29', '01528', 'Xã Hồng Sơn'),
    ('29', '01529', 'Xã Hàm Thuận Bắc'),
    ('32', '01530', 'Xã Thuận Hòa'),
    ('17', '01531', 'Xã Mai Phụ'),
    ('13', '01532', 'Xã Liên Minh'),
    ('27', '01533', 'Xã Tuy An Nam'),
    ('23', '01534', 'Phường Đăk Cấm'),
    ('13', '01535', 'Xã Giao Phúc'),
    ('14', '01536', 'Xã Tu Bông'),
    ('16', '01537', 'Phường Long Thuận'),
    ('27', '01538', 'Xã Ea Wer'),
    ('03', '01539', 'Phường Quảng Trị'),
    ('07', '01540', 'Xã Hoằng Tiến'),
    ('18', '01541', 'Xã Sơn Kiên'),
    ('06', '01542', 'Xã Yên Lập'),
    ('03', '01543', 'Xã Hiếu Giang'),
    ('24', '01544', 'Xã Lưu Nghiệp Anh'),
    ('06', '01545', 'Xã Bình Phú'),
    ('02', '01546', 'Xã Thần Khê'),
    ('08', '01547', 'Phường Hà Tu'),
    ('29', '01548', 'Xã Trà Tân'),
    ('22', '01549', 'Xã Xuân Phú'),
    ('29', '01550', 'Xã Bảo Thuận'),
    ('13', '01551', 'Xã Thanh Lâm'),
    ('11', '01552', 'Xã Anh Sơn'),
    ('34', '01553', 'Xã Hàm Yên'),
    ('15', '01554', 'Xã An Lục Long'),
    ('33', '01555', 'Xã Long Điền'),
    ('02', '01556', 'Xã Tân Thuận'),
    ('02', '01557', 'Xã Quang Hưng'),
    ('24', '01558', 'Xã Thạnh Trị'),
    ('32', '01559', 'Xã Lai Hòa'),
    ('02', '01560', 'Xã Đức Hợp'),
    ('24', '01561', 'Xã Bình Phước'),
    ('12', '01562', 'Phường Quảng Phú'),
    ('03', '01563', 'Xã Cửa Tùng'),
    ('21', '01564', 'Xã Thanh Nưa'),
    ('07', '01565', 'Xã Minh Sơn'),
    ('16', '01566', 'Xã Kim Sơn'),
    ('24', '01567', 'Xã Mỹ Chánh Hòa'),
    ('01', '01568', 'Xã Yên Xuân'),
    ('09', '01569', 'Xã Yên Bình'),
    ('30', '01570', 'Phường Tân Phước'),
    ('15', '01571', 'Xã Lộc Ninh'),
    ('18', '01572', 'Xã Vĩnh Hanh'),
    ('07', '01573', 'Xã Yên Trường'),
    ('24', '01574', 'Xã Mỹ Thuận'),
    ('13', '01575', 'Xã Giao Minh'),
    ('09', '01576', 'Xã Trấn Yên'),
    ('07', '01577', 'Xã Công Chính'),
    ('04', '01578', 'Phường Hương Thủy'),
    ('08', '01579', 'Phường Móng Cái 2'),
    ('24', '01580', 'Xã Quới An'),
    ('05', '01581', 'Xã An Quang'),
    ('05', '01582', 'Phường Nguyễn Đại Năng'),
    ('15', '01583', 'Xã Long Hựu'),
    ('19', '01584', 'Phường Phúc Thuận'),
    ('11', '01585', 'Xã Bạch Ngọc'),
    ('32', '01586', 'Xã Thạnh Thới An'),
    ('24', '01587', 'Xã Cầu Ngang'),
    ('29', '01588', 'Xã Tân Hội'),
    ('15', '01589', 'Phường Khánh Hậu'),
    ('23', '01590', 'Xã Khánh Cường'),
    ('24', '01591', 'Xã An Ngãi Trung'),
    ('06', '01592', 'Xã Nật Sơn'),
    ('02', '01593', 'Xã Tiên Tiến'),
    ('13', '01594', 'Xã Gia Viễn'),
    ('28', '01595', 'Xã Ia Krái'),
    ('05', '01596', 'Xã Vĩnh Thuận'),
    ('11', '01597', 'Xã Tân Phú'),
    ('07', '01598', 'Xã Thăng Bình'),
    ('06', '01599', 'Xã Võ Miếu'),
    ('33', '01600', 'Xã Quách Phẩm'),
    ('06', '01601', 'Xã Đan Thượng'),
    ('29', '01602', 'Xã Tuyên Quang'),
    ('03', '01603', 'Phường Ba Đồn'),
    ('27', '01604', 'Xã Cuôr Đăng'),
    ('16', '01605', 'Xã Đốc Binh Kiều'),
    ('27', '01606', 'Xã Ea Rốk'),
    ('05', '01607', 'Xã An Thành'),
    ('27', '01608', 'Xã Tân Tiến'),
    ('28', '01609', 'Xã Phù Mỹ Bắc'),
    ('17', '01610', 'Phường Hà Huy Tập'),
    ('07', '01611', 'Xã Tống Sơn'),
    ('17', '01612', 'Phường Bắc Hồng Lĩnh'),
    ('13', '01613', 'Xã Lai Thành'),
    ('07', '01614', 'Xã An Nông'),
    ('24', '01615', 'Xã Lộc Thuận'),
    ('13', '01616', 'Xã Nghĩa Sơn'),
    ('22', '01617', 'Xã Bình Tân'),
    ('11', '01618', 'Xã Đông Hiếu'),
    ('05', '01619', 'Xã Lạc Phượng'),
    ('24', '01620', 'Phường Phú Tân'),
    ('27', '01621', 'Xã Ea Wy'),
    ('10', '01622', 'Phường Tam Sơn'),
    ('07', '01623', 'Xã Quý Lộc'),
    ('15', '01624', 'Xã Mỹ Quý'),
    ('08', '01625', 'Phường Hoành Bồ'),
    ('10', '01626', 'Xã Đông Cứu'),
    ('28', '01627', 'Xã Phù Mỹ'),
    ('17', '01628', 'Xã Gia Hanh'),
    ('16', '01629', 'Xã Ba Sao'),
    ('09', '01630', 'Xã Gia Phú'),
    ('16', '01631', 'Xã Thạnh Phú'),
    ('24', '01632', 'Xã Châu Hòa'),
    ('24', '01633', 'Xã Hiếu Phụng'),
    ('07', '01634', 'Xã Định Hòa'),
    ('07', '01635', 'Xã Định Tân'),
    ('13', '01636', 'Phường Yên Thắng'),
    ('18', '01637', 'Phường Chi Lăng'),
    ('29', '01638', 'Phường Tiến Thành'),
    ('13', '01639', 'Xã Nam Đồng'),
    ('24', '01640', 'Xã An Qui'),
    ('11', '01641', 'Xã Văn Kiều'),
    ('13', '01642', 'Phường Duy Tân'),
    ('19', '01643', 'Xã Thành Công'),
    ('04', '01644', 'Xã Phú Lộc'),
    ('34', '01645', 'Xã Sơn Thuỷ'),
    ('30', '01646', 'Xã Châu Đức'),
    ('11', '01647', 'Xã Phúc Lộc'),
    ('24', '01648', 'Xã Hùng Hòa'),
    ('13', '01649', 'Xã Hồng Phong'),
    ('17', '01650', 'Xã Đan Hải'),
    ('20', '01651', 'Xã Chi Lăng'),
    ('05', '01652', 'Xã Vĩnh Hòa'),
    ('12', '01653', 'Xã Tiên Phước'),
    ('15', '01654', 'Xã Phước Vĩnh Tây'),
    ('05', '01655', 'Xã Nguyên Giáp'),
    ('29', '01656', 'Xã Đắk Sắk'),
    ('05', '01657', 'Xã Kiến Hưng'),
    ('04', '01658', 'Phường Phong Dinh'),
    ('06', '01659', 'Xã Chí Đám'),
    ('13', '01660', 'Xã Giao Hưng'),
    ('02', '01661', 'Xã A Sào'),
    ('30', '01662', 'Xã Bắc Tân Uyên'),
    ('06', '01663', 'Phường Phú Thọ'),
    ('29', '01664', 'Xã Ka Đô'),
    ('11', '01665', 'Xã Kim Bảng'),
    ('32', '01666', 'Xã Lịch Hội Thượng'),
    ('07', '01667', 'Xã Thắng Lợi'),
    ('29', '01668', 'Xã Nhân Cơ'),
    ('06', '01669', 'Xã Hoàng Cương'),
    ('04', '01670', 'Phường Phong Điền'),
    ('07', '01671', 'Xã Thọ Lập'),
    ('05', '01672', 'Xã Nam An Phụ'),
    ('27', '01673', 'Xã Sơn Thành'),
    ('10', '01674', 'Xã Nghĩa Phương'),
    ('32', '01675', 'Xã Vĩnh Hải'),
    ('30', '01676', 'Xã Nghĩa Thành'),
    ('10', '01677', 'Xã Tân Chi'),
    ('05', '01678', 'Xã Hà Nam'),
    ('31', '01679', 'Xã Chiềng Mung'),
    ('23', '01680', 'Xã Thọ Phong'),
    ('17', '01681', 'Xã Đồng Lộc'),
    ('15', '01682', 'Xã Tân Thành'),
    ('07', '01683', 'Xã Ngọc Liên'),
    ('13', '01684', 'Phường Liêm Tuyền'),
    ('07', '01685', 'Xã Quảng Yên'),
    ('16', '01686', 'Xã Mỹ Thiện'),
    ('13', '01687', 'Xã Liêm Hà'),
    ('11', '01688', 'Xã Yên Xuân'),
    ('33', '01689', 'Xã Đất Mới'),
    ('06', '01690', 'Xã Thanh Thuỷ'),
    ('13', '01691', 'Phường Nguyễn Uý'),
    ('24', '01692', 'Xã Hưng Khánh Trung'),
    ('12', '01693', 'Xã Vu Gia'),
    ('03', '01694', 'Xã Nam Ba Đồn'),
    ('03', '01695', 'Xã Khe Sanh'),
    ('22', '01696', 'Xã Long Hà'),
    ('27', '01697', 'Xã Xuân Lộc'),
    ('15', '01698', 'Xã Tân Đông'),
    ('12', '01699', 'Xã Phú Thuận'),
    ('16', '01700', 'Phường Nhị Quý'),
    ('07', '01701', 'Xã Hoằng Sơn'),
    ('05', '01702', 'Xã Tân An'),
    ('27', '01703', 'Xã Cư Pui'),
    ('06', '01704', 'Xã An Nghĩa'),
    ('03', '01705', 'Xã Vĩnh Linh'),
    ('10', '01706', 'Xã Bố Hạ'),
    ('06', '01707', 'Xã Lạc Sơn'),
    ('06', '01708', 'Xã Hiền Quan'),
    ('24', '01709', 'Xã An Phú Tân'),
    ('07', '01710', 'Xã Tây Đô'),
    ('07', '01711', 'Xã Tân Ninh'),
    ('02', '01712', 'Xã Tiên Lữ'),
    ('30', '01713', 'Xã Xuân Sơn'),
    ('08', '01714', 'Phường Phong Cốc'),
    ('05', '01715', 'Phường Dương Kinh'),
    ('28', '01716', 'Xã Bình Dương'),
    ('05', '01717', 'Xã Hải Hưng'),
    ('24', '01718', 'Xã Trung Ngãi'),
    ('34', '01719', 'Xã Phú Lương'),
    ('24', '01720', 'Xã Phước Long'),
    ('33', '01721', 'Xã Hồ Thị Kỷ'),
    ('26', '01722', 'Xã Than Uyên'),
    ('14', '01723', 'Xã Thuận Nam'),
    ('09', '01724', 'Xã Bát Xát'),
    ('05', '01725', 'Xã Bắc Thanh Miện'),
    ('09', '01726', 'Xã Xuân Quang'),
    ('05', '01727', 'Xã Tuệ Tĩnh'),
    ('28', '01728', 'Xã Phù Mỹ Nam'),
    ('02', '01729', 'Xã Thư Trì'),
    ('33', '01730', 'Xã Khánh An'),
    ('03', '01731', 'Xã Triệu Bình'),
    ('15', '01732', 'Xã Đông Thành'),
    ('03', '01733', 'Xã Cửa Việt'),
    ('02', '01734', 'Xã Đông Thái Ninh'),
    ('30', '01735', 'Xã Cần Giờ'),
    ('02', '01736', 'Xã Vũ Quý'),
    ('02', '01737', 'Xã Tân Hưng'),
    ('31', '01738', 'Phường Chiềng Sinh'),
    ('15', '01739', 'Xã Nhơn Ninh'),
    ('22', '01740', 'Xã Bom Bo'),
    ('07', '01741', 'Xã Hồ Vương'),
    ('13', '01742', 'Phường Tiên Sơn'),
    ('05', '01743', 'Phường Trần Nhân Tông'),
    ('32', '01744', 'Xã Vĩnh Trinh'),
    ('19', '01745', 'Xã Đại Từ'),
    ('07', '01746', 'Xã Thành Vinh'),
    ('06', '01747', 'Xã Yên Trị'),
    ('10', '01748', 'Xã Phù Lãng'),
    ('10', '01749', 'Xã Trung Chính'),
    ('12', '01750', 'Xã Phú Ninh'),
    ('10', '01751', 'Phường Cảnh Thụy'),
    ('13', '01752', 'Xã Hải An'),
    ('30', '01753', 'Xã Xuyên Mộc'),
    ('11', '01754', 'Phường Thái Hòa'),
    ('27', '01755', 'Xã Đồng Xuân'),
    ('09', '01756', 'Phường Trung Tâm'),
    ('05', '01757', 'Xã Hùng Thắng'),
    ('13', '01758', 'Xã Quang Thiện'),
    ('15', '01759', 'Xã Tân Trụ'),
    ('13', '01760', 'Phường Tam Điệp'),
    ('29', '01761', 'Xã Trường Xuân'),
    ('14', '01762', 'Phường Hòa Thắng'),
    ('28', '01763', 'Phường Ayun Pa'),
    ('27', '01764', 'Xã Liên Sơn Lắk'),
    ('10', '01765', 'Xã Nhân Thắng'),
    ('03', '01766', 'Xã Vĩnh Định'),
    ('18', '01767', 'Xã Mỹ Hòa Hưng'),
    ('10', '01768', 'Xã Đồng Việt'),
    ('12', '01769', 'Xã Hòa Vang'),
    ('13', '01770', 'Xã Giao Bình'),
    ('05', '01771', 'Phường Trần Liễu'),
    ('13', '01772', 'Xã Vụ Bản'),
    ('19', '01773', 'Phường Bách Quang'),
    ('03', '01774', 'Xã Cam Hồng'),
    ('07', '01775', 'Xã Xuân Hòa'),
    ('01', '01776', 'Xã Ba Vì'),
    ('14', '01777', 'Xã Hòa Trí'),
    ('03', '01778', 'Xã Nam Cửa Việt'),
    ('22', '01779', 'Xã Lộc Hưng'),
    ('29', '01780', 'Xã Sơn Mỹ'),
    ('07', '01781', 'Xã Quảng Ninh'),
    ('09', '01782', 'Phường Văn Phú'),
    ('33', '01783', 'Xã Thanh Tùng'),
    ('22', '01784', 'Xã Xuân Đường'),
    ('34', '01785', 'Xã Yên Minh'),
    ('15', '01786', 'Xã Hưng Thuận'),
    ('07', '01787', 'Xã Nga Thắng'),
    ('07', '01788', 'Xã Xuân Tín'),
    ('15', '01789', 'Xã Mỹ Thạnh'),
    ('27', '01790', 'Xã Hòa Mỹ'),
    ('11', '01791', 'Xã Lương Sơn'),
    ('13', '01792', 'Xã Khánh Trung'),
    ('28', '01793', 'Phường An Nhơn Đông'),
    ('06', '01794', 'Xã Tam Nông'),
    ('07', '01795', 'Xã Triệu Lộc'),
    ('11', '01796', 'Xã Tam Đồng'),
    ('05', '01797', 'Xã Vĩnh Thịnh'),
    ('32', '01798', 'Phường Long Bình'),
    ('24', '01799', 'Xã Tân Long Hội'),
    ('13', '01800', 'Xã Tân Thanh'),
    ('22', '01801', 'Xã Lộc Quang'),
    ('24', '01802', 'Xã Quới Thiện'),
    ('11', '01803', 'Xã Yên Trung'),
    ('07', '01804', 'Xã Như Thanh'),
    ('07', '01805', 'Phường Đào Duy Tư'),
    ('33', '01806', 'Xã Phú Mỹ'),
    ('12', '01807', 'Xã Việt An'),
    ('05', '01808', 'Xã Kiến Minh'),
    ('31', '01809', 'Xã Sông Mã'),
    ('27', '01810', 'Xã Tuy An Bắc'),
    ('02', '01811', 'Xã Tiên Hưng'),
    ('02', '01812', 'Xã Tiên Hoa'),
    ('28', '01813', 'Xã Hòa Hội'),
    ('05', '01814', 'Xã Chấn Hưng'),
    ('06', '01815', 'Xã Mường Động'),
    ('30', '01816', 'Xã Bình Châu'),
    ('13', '01817', 'Phường Kim Thanh'),
    ('07', '01818', 'Xã Cẩm Tú'),
    ('11', '01819', 'Xã Con Cuông'),
    ('34', '01820', 'Xã Đồng Văn'),
    ('06', '01821', 'Xã Hoàng An'),
    ('30', '01822', 'Xã Hòa Hiệp'),
    ('08', '01823', 'Xã Đầm Hà'),
    ('24', '01824', 'Xã Lương Hòa'),
    ('13', '01825', 'Xã Gia Vân'),
    ('15', '01826', 'Xã Tân Thạnh'),
    ('11', '01827', 'Xã Vân Du'),
    ('18', '01828', 'Phường Tô Châu'),
    ('16', '01829', 'Xã Tân Thạnh'),
    ('02', '01830', 'Xã Hưng Phú'),
    ('13', '01831', 'Xã Hải Quang'),
    ('33', '01832', 'Xã Hoà Bình'),
    ('02', '01833', 'Xã Xuân Trúc'),
    ('32', '01834', 'Xã Tân Phước Hưng'),
    ('14', '01835', 'Xã Thuận Bắc'),
    ('04', '01836', 'Phường Phong Quảng'),
    ('19', '01837', 'Xã Tân Thành'),
    ('32', '01838', 'Xã Thạnh Phú'),
    ('13', '01839', 'Xã Khánh Thiện'),
    ('05', '01840', 'Xã Nghi Dương'),
    ('11', '01841', 'Xã Nghĩa Khánh'),
    ('28', '01842', 'Xã Ngô Mây'),
    ('14', '01843', 'Xã Đại Lãnh'),
    ('23', '01844', 'Đặc khu Lý Sơn'),
    ('06', '01845', 'Xã Phú Khê'),
    ('29', '01846', 'Xã Tân Hải'),
    ('13', '01847', 'Xã Khánh Nhạc'),
    ('10', '01848', 'Xã Tam Giang'),
    ('09', '01849', 'Xã Mường Lai'),
    ('28', '01850', 'Phường Hoài Nhơn Tây'),
    ('24', '01851', 'Xã Lương Phú'),
    ('03', '01852', 'Xã Nam Hải Lăng'),
    ('05', '01853', 'Xã An Hưng'),
    ('19', '01854', 'Xã Tân Cương'),
    ('06', '01855', 'Xã Tam Sơn'),
    ('21', '01856', 'Phường Mường Thanh'),
    ('22', '01857', 'Xã Bình An'),
    ('02', '01858', 'Xã Lê Lợi'),
    ('27', '01859', 'Xã Tam Giang'),
    ('11', '01860', 'Xã Nghĩa Hưng'),
    ('17', '01861', 'Xã Xuân Lộc'),
    ('30', '01862', 'Xã Châu Pha'),
    ('15', '01863', 'Xã Cầu Khởi'),
    ('26', '01864', 'Phường Đoàn Kết'),
    ('27', '01865', 'Xã Hòa Sơn'),
    ('19', '01866', 'Phường Bắc Kạn'),
    ('24', '01867', 'Xã Mỹ Long'),
    ('24', '01868', 'Phường Hòa Thuận'),
    ('07', '01869', 'Xã Thiệu Tiến'),
    ('10', '01870', 'Phường Bồng Lai'),
    ('15', '01871', 'Xã Vàm Cỏ'),
    ('30', '01872', 'Xã Thanh An'),
    ('32', '01873', 'Xã Trường Long Tây'),
    ('17', '01874', 'Xã Cẩm Bình'),
    ('02', '01875', 'Xã Nam Đông Hưng'),
    ('06', '01876', 'Xã Lạc Lương'),
    ('31', '01877', 'Xã Mường Bú'),
    ('28', '01878', 'Xã Kbang'),
    ('12', '01879', 'Xã Bà Nà'),
    ('02', '01880', 'Xã Bắc Đông Quan'),
    ('02', '01881', 'Xã Tây Tiền Hải'),
    ('09', '01882', 'Phường Cầu Thia'),
    ('24', '01883', 'Xã Bảo Thạnh'),
    ('23', '01884', 'Xã Đăk Rơ Wa'),
    ('30', '01885', 'Xã Long Hòa'),
    ('29', '01886', 'Xã Phú Sơn - Lâm Hà'),
    ('18', '01887', 'Xã Núi Cấm'),
    ('02', '01888', 'Xã Đông Quan'),
    ('16', '01889', 'Xã Phú Thành'),
    ('03', '01890', 'Xã Diên Sanh'),
    ('29', '01891', 'Xã Hồng Thái'),
    ('16', '01892', 'Xã Tân Hộ Cơ'),
    ('11', '01893', 'Xã Nghĩa Lộc'),
    ('02', '01894', 'Xã Đồng Bằng'),
    ('31', '01895', 'Xã Vân Hồ'),
    ('10', '01896', 'Xã Phúc Hòa'),
    ('33', '01897', 'Xã Phước Long'),
    ('20', '01898', 'Xã Đồng Đăng'),
    ('08', '01899', 'Phường An Sinh'),
    ('07', '01900', 'Xã Nga An'),
    ('05', '01901', 'Phường Kinh Môn'),
    ('28', '01902', 'Xã Ia Ko'),
    ('22', '01903', 'Phường Hàng Gòn'),
    ('05', '01904', 'Phường Phạm Sư Mạnh'),
    ('14', '01905', 'Xã Cà Ná'),
    ('05', '01906', 'Phường Nam Đồng'),
    ('29', '01907', 'Xã Quảng Lập'),
    ('07', '01908', 'Xã Lĩnh Toại'),
    ('28', '01909', 'Phường Quy Nhơn Tây'),
    ('28', '01910', 'Phường Tam Quan'),
    ('17', '01911', 'Xã Tiên Điền'),
    ('11', '01912', 'Xã Vĩnh Tường'),
    ('12', '01913', 'Xã Thăng Trường'),
    ('12', '01914', 'Xã Thạnh Bình'),
    ('23', '01915', 'Xã Sơn Hạ'),
    ('12', '01916', 'Xã Đồng Dương'),
    ('06', '01917', 'Xã Đạo Trù'),
    ('09', '01918', 'Xã Xuân Ái'),
    ('05', '01919', 'Phường Ái Quốc'),
    ('11', '01920', 'Phường Tây Hiếu'),
    ('01', '01921', 'Phường Thượng Cát'),
    ('31', '01922', 'Xã Phiêng Pằn'),
    ('02', '01923', 'Xã Minh Thọ'),
    ('03', '01924', 'Xã Tân Mỹ'),
    ('05', '01925', 'Phường Lê Đại Hành'),
    ('28', '01926', 'Xã Ia Grai'),
    ('31', '01927', 'Xã Mường Hung'),
    ('32', '01928', 'Xã Đông Thuận'),
    ('05', '01929', 'Xã Thượng Hồng'),
    ('02', '01930', 'Xã Hồng Minh'),
    ('05', '01931', 'Xã Nguyễn Bỉnh Khiêm'),
    ('31', '01932', 'Xã Mường Khiêng'),
    ('13', '01933', 'Xã Nhân Hà'),
    ('03', '01934', 'Xã Đồng Lê'),
    ('30', '01935', 'Xã Trừ Văn Thố'),
    ('32', '01936', 'Xã Đại Ngãi'),
    ('06', '01937', 'Xã Lạc Thủy'),
    ('15', '01938', 'Xã Long Thuận'),
    ('02', '01939', 'Xã Bình Thanh'),
    ('32', '01940', 'Xã Hòa Tú'),
    ('11', '01941', 'Xã Nam Đàn'),
    ('02', '01942', 'Xã Ngọc Lâm'),
    ('15', '01943', 'Xã Tân Hòa'),
    ('33', '01944', 'Phường Bạc Liêu'),
    ('11', '01945', 'Xã Đại Huệ'),
    ('13', '01946', 'Xã Định Hóa'),
    ('09', '01947', 'Xã Mường Khương'),
    ('32', '01948', 'Xã Vĩnh Viễn'),
    ('10', '01949', 'Xã Sơn Động'),
    ('20', '01950', 'Xã Na Dương'),
    ('24', '01951', 'Phường Duyên Hải'),
    ('06', '01952', 'Xã Đại Đồng'),
    ('29', '01953', 'Xã Đắk Wil'),
    ('13', '01954', 'Xã Bình Giang'),
    ('34', '01955', 'Xã Bình Ca'),
    ('07', '01956', 'Xã Thọ Ngọc'),
    ('32', '01957', 'Xã Vĩnh Lợi'),
    ('15', '01958', 'Xã Trà Vong'),
    ('13', '01959', 'Phường Duy Hà'),
    ('21', '01960', 'Xã Tuần Giáo'),
    ('09', '01961', 'Xã Bảo Ái'),
    ('21', '01962', 'Xã Mường Nhé'),
    ('28', '01963', 'Xã Ia Le'),
    ('14', '01964', 'Xã Lâm Sơn'),
    ('30', '01965', 'Xã Minh Thạnh'),
    ('16', '01966', 'Xã Vĩnh Hựu'),
    ('06', '01967', 'Xã Minh Đài'),
    ('29', '01968', 'Phường Đông Gia Nghĩa'),
    ('14', '01969', 'Xã Suối Dầu'),
    ('14', '01970', 'Xã Suối Hiệp'),
    ('22', '01971', 'Xã An Viễn'),
    ('07', '01972', 'Xã Vân Du'),
    ('18', '01973', 'Xã Hòa Điền'),
    ('32', '01974', 'Xã Hỏa Lựu'),
    ('31', '01975', 'Xã Sốp Cộp'),
    ('15', '01976', 'Xã Tân Châu'),
    ('32', '01977', 'Xã Trường Long'),
    ('13', '01978', 'Xã Đồng Thái'),
    ('15', '01979', 'Xã Thạnh Lợi'),
    ('32', '01980', 'Xã Lương Tâm'),
    ('06', '01981', 'Xã Yên Thủy'),
    ('27', '01982', 'Xã Xuân Cảnh'),
    ('10', '01983', 'Xã Phật Tích'),
    ('27', '01984', 'Xã Ea Drông'),
    ('07', '01985', 'Phường Trúc Lâm'),
    ('06', '01986', 'Xã Thái Hòa'),
    ('09', '01987', 'Xã Văn Bàn'),
    ('29', '01988', 'Xã Lương Sơn'),
    ('34', '01989', 'Xã Vị Xuyên'),
    ('17', '01990', 'Xã Cẩm Duệ'),
    ('27', '01991', 'Xã Ea Ô'),
    ('13', '01992', 'Xã Đại Hoàng'),
    ('23', '01993', 'Xã Phước Giang'),
    ('27', '01994', 'Xã Sông Hinh'),
    ('16', '01995', 'Xã An Phước'),
    ('33', '01996', 'Xã Tân Ân'),
    ('31', '01997', 'Xã Chiềng Mai'),
    ('09', '01998', 'Xã Văn Chấn'),
    ('17', '01999', 'Xã Kỳ Khang'),
    ('13', '02000', 'Xã Thanh Sơn'),
    ('11', '02001', 'Xã Nghĩa Lâm'),
    ('15', '02002', 'Phường Kiến Tường'),
    ('10', '02003', 'Xã Đông Phú'),
    ('02', '02004', 'Xã Bắc Đông Hưng'),
    ('19', '02005', 'Xã Tân Khánh'),
    ('22', '02006', 'Xã Lộc Tấn'),
    ('22', '02007', 'Xã Đak Nhau'),
    ('22', '02008', 'Xã Thuận Lợi'),
    ('29', '02009', 'Phường Nam Gia Nghĩa'),
    ('13', '02010', 'Xã Khánh Hội'),
    ('16', '02011', 'Xã Tân Phú Đông'),
    ('13', '02012', 'Xã Thanh Liêm'),
    ('28', '02013', 'Xã Đức Cơ'),
    ('17', '02014', 'Xã Kỳ Xuân'),
    ('07', '02015', 'Xã Yên Ninh'),
    ('17', '02016', 'Xã Trường Lưu'),
    ('04', '02017', 'Xã Phú Hồ'),
    ('19', '02018', 'Xã Yên Trạch'),
    ('32', '02019', 'Xã Mỹ Phước'),
    ('03', '02020', 'Xã Triệu Phong'),
    ('02', '02021', 'Xã Lê Quý Đôn'),
    ('14', '02022', 'Xã Nam Cam Ranh'),
    ('02', '02023', 'Xã Đông Tiên Hưng'),
    ('02', '02024', 'Xã Thụy Anh'),
    ('07', '02025', 'Xã Ngọc Trạo'),
    ('15', '02026', 'Xã Ninh Điền'),
    ('07', '02027', 'Xã Nguyệt Ấn'),
    ('03', '02028', 'Xã Lao Bảo'),
    ('24', '02029', 'Xã Lục Sỹ Thành'),
    ('03', '02030', 'Xã Lệ Ninh'),
    ('06', '02031', 'Xã Liên Minh'),
    ('23', '02032', 'Xã Ngọk Bay'),
    ('06', '02033', 'Xã Sơn Lương'),
    ('14', '02034', 'Xã Diên Lạc'),
    ('28', '02035', 'Xã Ia Phí'),
    ('28', '02036', 'Xã Bình Phú'),
    ('10', '02037', 'Xã Chi Lăng'),
    ('20', '02038', 'Xã Lộc Bình'),
    ('15', '02039', 'Xã Phước Vinh'),
    ('15', '02040', 'Xã Lương Hoà'),
    ('29', '02041', 'Xã Phúc Thọ - Lâm Hà'),
    ('26', '02042', 'Xã Phong Thổ'),
    ('33', '02043', 'Xã Tam Giang'),
    ('07', '02044', 'Xã Hà Long'),
    ('09', '02045', 'Phường Âu Lâu'),
    ('13', '02046', 'Phường Kim Bảng'),
    ('24', '02047', 'Xã Châu Hưng'),
    ('18', '02048', 'Xã Tây Phú'),
    ('31', '02049', 'Xã Chiềng Khoong'),
    ('18', '02050', 'Đặc khu Kiên Hải'),
    ('02', '02051', 'Xã Hồng Vũ'),
    ('27', '02052', 'Xã Krông Bông'),
    ('20', '02053', 'Phường Lương Văn Tri'),
    ('02', '02054', 'Xã Tân Tiến'),
    ('29', '02055', 'Xã Đạ Huoai'),
    ('28', '02056', 'Xã Ia Lâu'),
    ('11', '02057', 'Xã Quỳ Châu'),
    ('33', '02058', 'Phường Vĩnh Trạch'),
    ('33', '02059', 'Xã Đông Hải'),
    ('19', '02060', 'Xã Phú Xuyên'),
    ('07', '02061', 'Xã Yên Thọ'),
    ('29', '02062', 'Xã Tà Hine'),
    ('07', '02063', 'Xã Hoằng Phú'),
    ('11', '02064', 'Xã Cát Ngạn'),
    ('27', '02065', 'Xã Hòa Xuân'),
    ('13', '02066', 'Phường Lý Thường Kiệt'),
    ('07', '02067', 'Xã Đồng Tiến'),
    ('28', '02068', 'Xã Ia Krêl'),
    ('06', '02069', 'Xã Hùng Việt'),
    ('15', '02070', 'Xã Đức Huệ'),
    ('06', '02071', 'Phường Thống Nhất'),
    ('09', '02072', 'Phường Sa Pa'),
    ('27', '02073', 'Xã Đắk Liêng'),
    ('09', '02074', 'Xã Si Ma Cai'),
    ('11', '02075', 'Xã Quế Phong'),
    ('10', '02076', 'Xã Đồng Kỳ'),
    ('27', '02077', 'Xã M’Drắk'),
    ('07', '02078', 'Xã Cẩm Vân'),
    ('15', '02079', 'Xã Vĩnh Công'),
    ('02', '02080', 'Xã Đoàn Đào'),
    ('05', '02081', 'Phường Bắc An Phụ'),
    ('11', '02082', 'Xã Tân An'),
    ('22', '02083', 'Xã Tân Lợi'),
    ('32', '02084', 'Xã Đông Hiệp'),
    ('34', '02085', 'Xã Khâu Vai'),
    ('06', '02086', 'Xã Quyết Thắng'),
    ('16', '02087', 'Xã Tràm Chim'),
    ('13', '02088', 'Xã Phú Sơn'),
    ('29', '02089', 'Xã Tà Đùng'),
    ('31', '02090', 'Phường Chiềng Cơi'),
    ('06', '02091', 'Xã Hy Cương'),
    ('28', '02092', 'Xã KDang'),
    ('24', '02093', 'Xã Đại An'),
    ('19', '02094', 'Phường Đức Xuân'),
    ('29', '02095', 'Xã Krông Nô'),
    ('10', '02096', 'Phường Hạp Lĩnh'),
    ('11', '02097', 'Xã Nhân Hòa'),
    ('29', '02098', 'Xã Thuận An'),
    ('30', '02099', 'Xã An Thới Đông'),
    ('28', '02100', 'Xã Ia Rsai'),
    ('30', '02101', 'Xã Bàu Lâm'),
    ('08', '02102', 'Phường Móng Cái 3'),
    ('05', '02103', 'Xã Quyết Thắng'),
    ('28', '02104', 'Xã Kon Gang'),
    ('13', '02105', 'Xã Yên Mạc'),
    ('12', '02106', 'Xã Thượng Đức'),
    ('31', '02107', 'Phường Thảo Nguyên'),
    ('28', '02108', 'Xã Bình Hiệp'),
    ('03', '02109', 'Xã Tân Gianh'),
    ('28', '02110', 'Xã Ân Hảo'),
    ('02', '02111', 'Xã Nguyễn Du'),
    ('10', '02112', 'Phường Ninh Xá'),
    ('11', '02113', 'Xã Quang Đồng'),
    ('06', '02114', 'Xã Hiền Lương'),
    ('19', '02115', 'Xã Định Hóa'),
    ('07', '02116', 'Xã Xuân Du'),
    ('11', '02117', 'Xã Nghĩa Hành'),
    ('17', '02118', 'Phường Nam Hồng Lĩnh'),
    ('29', '02119', 'Xã Tân Minh'),
    ('18', '02120', 'Xã Đông Hưng'),
    ('22', '02121', 'Xã Nha Bích'),
    ('28', '02122', 'Xã Bàu Cạn'),
    ('02', '02123', 'Xã Nam Thụy Anh'),
    ('07', '02124', 'Xã Kiên Thọ'),
    ('28', '02125', 'Xã Uar'),
    ('07', '02126', 'Xã Trường Văn'),
    ('08', '02127', 'Xã Tiên Yên'),
    ('02', '02128', 'Xã Bình Định'),
    ('16', '02129', 'Xã Tân Điền'),
    ('07', '02130', 'Phường Tân Dân'),
    ('15', '02131', 'Xã Thạnh Phước'),
    ('19', '02132', 'Xã Vạn Phú'),
    ('23', '02133', 'Xã Trường Giang'),
    ('29', '02134', 'Xã Quảng Sơn'),
    ('22', '02135', 'Xã Xuân Thành'),
    ('03', '02136', 'Xã Triệu Cơ'),
    ('33', '02137', 'Phường Giá Rai'),
    ('17', '02138', 'Xã Cẩm Hưng'),
    ('11', '02139', 'Xã Hải Lộc'),
    ('09', '02140', 'Xã Đông Cuông'),
    ('13', '02141', 'Xã Trần Thương'),
    ('31', '02142', 'Xã Gia Phù'),
    ('08', '02143', 'Phường Bình Khê'),
    ('31', '02144', 'Xã Bắc Yên'),
    ('23', '02145', 'Phường Đăk BLa'),
    ('34', '02146', 'Xã Nhữ Khê'),
    ('15', '02147', 'Xã Tân Hội'),
    ('06', '02148', 'Xã Hạ Hòa'),
    ('18', '02149', 'Xã Vân Khánh'),
    ('34', '02150', 'Xã Linh Hồ'),
    ('11', '02151', 'Xã Thần Lĩnh'),
    ('13', '02152', 'Xã Thanh Bình'),
    ('28', '02153', 'Xã Bình Khê'),
    ('16', '02154', 'Xã Phương Thịnh'),
    ('13', '02155', 'Xã Gia Hưng'),
    ('28', '02156', 'Xã Chư A Thai'),
    ('34', '02157', 'Phường Hà Giang 1'),
    ('08', '02158', 'Phường Đông Mai'),
    ('28', '02159', 'Xã Vạn Đức'),
    ('07', '02160', 'Xã Trường Lâm'),
    ('27', '02161', 'Phường Xuân Đài'),
    ('07', '02162', 'Xã Hoạt Giang'),
    ('09', '02163', 'Xã Bảo Yên'),
    ('07', '02164', 'Xã Tân Tiến'),
    ('29', '02165', 'Xã Nam Đà'),
    ('23', '02166', 'Xã Ba Gia'),
    ('03', '02167', 'Xã Minh Hóa'),
    ('33', '02168', 'Phường Láng Tròn'),
    ('29', '02169', 'Xã Gia Hiệp'),
    ('07', '02170', 'Xã Các Sơn'),
    ('22', '02171', 'Xã Thọ Sơn'),
    ('03', '02172', 'Xã Tuyên Hóa'),
    ('07', '02173', 'Xã Bá Thước'),
    ('15', '02174', 'Xã Bình Hiệp'),
    ('01', '02175', 'Xã Yên Bài'),
    ('11', '02176', 'Xã Nghĩa Thọ'),
    ('28', '02177', 'Xã Ia Hiao'),
    ('17', '02178', 'Phường Vũng Áng'),
    ('19', '02179', 'Xã Phú Thịnh'),
    ('08', '02180', 'Phường Hà An'),
    ('27', '02181', 'Xã Dang Kang'),
    ('11', '02182', 'Xã Minh Hợp'),
    ('29', '02183', 'Xã Sông Lũy'),
    ('30', '02184', 'Xã Thường Tân'),
    ('06', '02185', 'Xã Tây Cốc'),
    ('24', '02186', 'Xã Thạnh Phước'),
    ('03', '02187', 'Xã Trường Phú'),
    ('15', '02188', 'Xã Vĩnh Hưng'),
    ('13', '02189', 'Phường Yên Sơn'),
    ('22', '02190', 'Xã Xuân Quế'),
    ('03', '02191', 'Xã Sen Ngư'),
    ('23', '02192', 'Xã Ia Chim'),
    ('10', '02193', 'Phường Trạm Lộ'),
    ('16', '02194', 'Xã Phú Cường'),
    ('19', '02195', 'Xã Phú Lạc'),
    ('31', '02196', 'Phường Mộc Châu'),
    ('07', '02197', 'Xã Cẩm Tân'),
    ('19', '02198', 'Phường Sông Công'),
    ('06', '02199', 'Xã Hợp Kim'),
    ('16', '02200', 'Xã Tam Nông'),
    ('12', '02201', 'Xã Nông Sơn'),
    ('07', '02202', 'Xã Điền Lư'),
    ('31', '02203', 'Xã Chiềng Lao'),
    ('17', '02204', 'Phường Hoành Sơn'),
    ('17', '02205', 'Xã Đông Kinh'),
    ('06', '02206', 'Xã Yên Kỳ'),
    ('24', '02207', 'Xã Thới Thuận'),
    ('17', '02208', 'Xã Tùng Lộc'),
    ('28', '02209', 'Xã Kông Chro'),
    ('17', '02210', 'Xã Sơn Tiến'),
    ('06', '02211', 'Xã Mường Bi'),
    ('03', '02212', 'Xã Cồn Tiên'),
    ('16', '02213', 'Phường Thanh Hòa'),
    ('18', '02214', 'Xã Vĩnh Gia'),
    ('06', '02215', 'Xã Mường Vang'),
    ('01', '02216', 'Xã Hòa Lạc'),
    ('23', '02217', 'Xã Trà Giang'),
    ('03', '02218', 'Xã Vĩnh Thủy'),
    ('05', '02219', 'Xã Hợp Tiến'),
    ('29', '02220', 'Xã Nghị Đức'),
    ('01', '02221', 'Phường Lĩnh Nam'),
    ('13', '02222', 'Xã Quang Hưng'),
    ('07', '02223', 'Xã Ba Đình'),
    ('21', '02224', 'Xã Thanh An'),
    ('15', '02225', 'Xã Mỹ An'),
    ('13', '02226', 'Xã Gia Trấn'),
    ('20', '02227', 'Xã Tuấn Sơn'),
    ('06', '02228', 'Xã Xuân Lũng'),
    ('29', '02229', 'Xã Đinh Trang Thượng'),
    ('06', '02230', 'Xã Đại Đình'),
    ('09', '02231', 'Xã Tằng Lỏong'),
    ('04', '02232', 'Xã A Lưới 2'),
    ('20', '02233', 'Xã Tân Thành'),
    ('17', '02234', 'Phường Hải Ninh'),
    ('26', '02235', 'Xã Mường Kim'),
    ('06', '02236', 'Xã Đông Thành'),
    ('31', '02237', 'Xã Chiềng La'),
    ('06', '02238', 'Xã Cao Phong'),
    ('15', '02239', 'Xã Khánh Hưng'),
    ('05', '02240', 'Xã Thái Tân'),
    ('25', '02241', 'Xã Hòa An'),
    ('28', '02242', 'Xã Ia Pia'),
    ('23', '02243', 'Xã Sơn Hà'),
    ('31', '02244', 'Phường Chiềng An'),
    ('06', '02245', 'Phường Kỳ Sơn'),
    ('28', '02246', 'Xã Ia Tul'),
    ('24', '02247', 'Xã Thạnh Phong'),
    ('11', '02248', 'Xã Nghĩa Đồng'),
    ('13', '02249', 'Xã Gia Lâm'),
    ('28', '02250', 'Xã An Nhơn Tây'),
    ('27', '02251', 'Xã Ea Kiết'),
    ('13', '02252', 'Xã Kim Sơn'),
    ('09', '02253', 'Xã Tân Lĩnh'),
    ('20', '02254', 'Xã Thất Khê'),
    ('34', '02255', 'Xã Minh Quang'),
    ('19', '02256', 'Xã An Khánh'),
    ('10', '02257', 'Xã Cẩm Lý'),
    ('17', '02258', 'Xã Tứ Mỹ'),
    ('19', '02259', 'Phường Bá Xuyên'),
    ('18', '02260', 'Xã Giang Thành'),
    ('33', '02261', 'Xã Vĩnh Phước'),
    ('06', '02262', 'Xã Dũng Tiến'),
    ('29', '02263', 'Xã Hòa Bắc'),
    ('34', '02264', 'Xã Sơn Vĩ'),
    ('23', '02265', 'Xã Sa Thầy'),
    ('02', '02266', 'Xã Nam Thái Ninh'),
    ('12', '02267', 'Xã Trà My'),
    ('15', '02268', 'Xã Nhơn Hòa Lập'),
    ('02', '02269', 'Xã Tống Trân'),
    ('19', '02270', 'Xã Văn Hán'),
    ('06', '02271', 'Xã Mường Thàng'),
    ('28', '02272', 'Xã Cửu An'),
    ('06', '02273', 'Xã Yên Phú'),
    ('06', '02274', 'Xã Đà Bắc'),
    ('29', '02275', 'Xã Cát Tiên'),
    ('34', '02276', 'Xã Mèo Vạc'),
    ('23', '02277', 'Xã Bình Minh'),
    ('11', '02278', 'Xã Nghĩa Đàn'),
    ('11', '02279', 'Xã Tiên Đồng'),
    ('21', '02280', 'Xã Búng Lao'),
    ('29', '02281', 'Xã Nâm Nung'),
    ('29', '02282', 'Xã Tân Lập'),
    ('06', '02283', 'Xã Hợp Lý'),
    ('23', '02284', 'Xã Đăk Mar'),
    ('21', '02285', 'Xã Na Sang'),
    ('34', '02286', 'Xã Xín Mần'),
    ('09', '02287', 'Xã Lâm Thượng'),
    ('31', '02288', 'Xã Mường Cơi'),
    ('14', '02289', 'Xã Cam An'),
    ('09', '02290', 'Xã Púng Luông'),
    ('25', '02291', 'Phường Nùng Trí Cao'),
    ('20', '02292', 'Xã Vân Nham'),
    ('13', '02293', 'Xã Gia Tường'),
    ('17', '02294', 'Xã Cẩm Trung'),
    ('07', '02295', 'Xã Thạch Lập'),
    ('06', '02296', 'Xã Nhân Nghĩa'),
    ('28', '02297', 'Xã Chư Păh'),
    ('15', '02298', 'Xã Tân Tây'),
    ('29', '02299', 'Xã Hải Ninh'),
    ('34', '02300', 'Xã Hồng Sơn'),
    ('17', '02301', 'Xã Cẩm Lạc'),
    ('19', '02302', 'Xã Dân Tiến'),
    ('22', '02303', 'Xã Đăk Ơ'),
    ('15', '02304', 'Xã Hậu Thạnh'),
    ('15', '02305', 'Xã Hưng Điền'),
    ('10', '02306', 'Xã Đại Lai'),
    ('33', '02307', 'Xã Vĩnh Thanh'),
    ('02', '02308', 'Xã Bình Nguyên'),
    ('06', '02309', 'Xã Liên Hòa'),
    ('29', '02310', 'Xã Thuận Hạnh'),
    ('10', '02311', 'Xã Xuân Lương'),
    ('21', '02312', 'Xã Sáng Nhè'),
    ('06', '02313', 'Xã Thịnh Minh'),
    ('02', '02314', 'Xã Bắc Thụy Anh'),
    ('15', '02315', 'Xã Tuyên Bình'),
    ('02', '02316', 'Xã Trà Giang'),
    ('06', '02317', 'Xã Mai Châu'),
    ('17', '02318', 'Xã Kim Hoa'),
    ('03', '02319', 'Xã Ái Tử'),
    ('04', '02320', 'Phường Phong Phú'),
    ('03', '02321', 'Xã Kim Phú'),
    ('32', '02322', 'Xã Thới Hưng'),
    ('16', '02323', 'Xã An Hòa'),
    ('03', '02324', 'Xã Vĩnh Hoàng'),
    ('34', '02325', 'Xã Xuân Vân'),
    ('34', '02326', 'Xã Mậu Duệ'),
    ('10', '02327', 'Xã Kiên Lao'),
    ('09', '02328', 'Xã Nghĩa Tâm'),
    ('17', '02329', 'Xã Sơn Giang'),
    ('08', '02330', 'Phường Mông Dương'),
    ('06', '02331', 'Xã An Bình'),
    ('06', '02332', 'Phường Âu Cơ'),
    ('29', '02333', 'Xã Bắc Ruộng'),
    ('22', '02334', 'Phường Xuân Lập'),
    ('23', '02335', 'Xã Trà Bồng'),
    ('07', '02336', 'Xã Mậu Lâm'),
    ('14', '02337', 'Xã Vạn Hưng'),
    ('34', '02338', 'Xã Tân Thanh'),
    ('28', '02339', 'Xã Ia Boòng'),
    ('11', '02340', 'Xã Môn Sơn'),
    ('02', '02341', 'Xã Quang Lịch'),
    ('03', '02342', 'Xã Tuyên Phú'),
    ('09', '02343', 'Xã Chấn Thịnh'),
    ('17', '02344', 'Xã Toàn Lưu'),
    ('06', '02345', 'Xã Văn Miếu'),
    ('31', '02346', 'Xã Chiềng Hặc'),
    ('17', '02347', 'Xã Đức Minh'),
    ('02', '02348', 'Phường Hồng Châu'),
    ('09', '02349', 'Phường Nghĩa Lộ'),
    ('31', '02350', 'Xã Chiềng Khương'),
    ('09', '02351', 'Xã Tả Van'),
    ('10', '02352', 'Xã Trường Sơn'),
    ('17', '02353', 'Xã Hương Phố'),
    ('34', '02354', 'Phường Bình Thuận'),
    ('17', '02355', 'Xã Đồng Tiến'),
    ('26', '02356', 'Xã Bình Lư'),
    ('28', '02357', 'Xã Ân Tường'),
    ('28', '02358', 'Xã Đak Pơ'),
    ('06', '02359', 'Xã Dân Chủ'),
    ('09', '02360', 'Xã Bản Lầu'),
    ('07', '02361', 'Xã Thọ Bình'),
    ('28', '02362', 'Xã Phù Mỹ Tây'),
    ('11', '02363', 'Xã Tương Dương'),
    ('06', '02364', 'Xã Yên Lãng'),
    ('13', '02365', 'Xã Trực Ninh'),
    ('34', '02366', 'Xã Quản Bạ'),
    ('06', '02367', 'Xã Thượng Cốc'),
    ('31', '02368', 'Xã Tân Yên'),
    ('23', '02369', 'Xã Kon Braih'),
    ('07', '02370', 'Phường Hải Lĩnh'),
    ('34', '02371', 'Xã Đồng Yên'),
    ('34', '02372', 'Xã Thái Hoà'),
    ('24', '02373', 'Xã Thạnh Hải'),
    ('18', '02374', 'Xã Bình Giang'),
    ('06', '02375', 'Xã Tân Sơn'),
    ('19', '02376', 'Xã La Bằng'),
    ('21', '02377', 'Phường Mường Lay'),
    ('25', '02378', 'Phường Tân Giang'),
    ('17', '02379', 'Xã Phúc Trạch'),
    ('16', '02380', 'Xã Trường Xuân'),
    ('20', '02381', 'Xã Tân Thanh'),
    ('13', '02382', 'Phường Tam Chúc'),
    ('27', '02383', 'Xã Vụ Bổn'),
    ('31', '02384', 'Xã Nậm Lầu'),
    ('34', '02385', 'Xã Đông Thọ'),
    ('12', '02386', 'Xã Tam Mỹ'),
    ('08', '02387', 'Xã Đông Ngũ'),
    ('11', '02388', 'Xã Châu Tiến'),
    ('08', '02389', 'Xã Quảng Tân'),
    ('15', '02390', 'Xã Tân Hưng'),
    ('23', '02391', 'Xã Nguyễn Nghiêm'),
    ('13', '02392', 'Xã Quỳnh Lưu'),
    ('07', '02393', 'Xã Tượng Lĩnh'),
    ('34', '02394', 'Xã Bình Xa'),
    ('06', '02395', 'Xã Văn Lang'),
    ('33', '02396', 'Xã Vĩnh Hậu'),
    ('31', '02397', 'Xã Đoàn Kết'),
    ('11', '02398', 'Xã Mường Quàng'),
    ('09', '02399', 'Xã Võ Lao'),
    ('02', '02400', 'Xã Bắc Thái Ninh'),
    ('30', '02401', 'Xã An Long'),
    ('06', '02402', 'Xã Hương Cần'),
    ('25', '02403', 'Xã Trùng Khánh'),
    ('11', '02404', 'Xã Nghĩa Mai'),
    ('28', '02405', 'Xã Ia Dơk'),
    ('29', '02406', 'Xã Quảng Khê'),
    ('21', '02407', 'Xã Tủa Chùa'),
    ('30', '02408', 'Xã Long Sơn'),
    ('09', '02409', 'Phường Nam Cường'),
    ('15', '02410', 'Xã Long Chữ'),
    ('17', '02411', 'Xã Kỳ Văn'),
    ('27', '02412', 'Xã Cư Pơng'),
    ('17', '02413', 'Xã Thạch Lạc'),
    ('28', '02414', 'Xã Lơ Pang'),
    ('31', '02415', 'Xã Chiềng Hoa'),
    ('10', '02416', 'Xã Tam Tiến'),
    ('34', '02417', 'Xã Trường Sinh'),
    ('12', '02418', 'Xã Sơn Cẩm Hà'),
    ('21', '02419', 'Xã Mường Ảng'),
    ('17', '02420', 'Xã Yên Hòa'),
    ('09', '02421', 'Xã Khánh Hòa'),
    ('33', '02422', 'Xã Gành Hào'),
    ('29', '02423', 'Xã Quảng Phú'),
    ('06', '02424', 'Xã Chí Tiên'),
    ('14', '02425', 'Xã Tây Ninh Hòa'),
    ('17', '02426', 'Xã Hương Bình'),
    ('17', '02427', 'Xã Thạch Khê'),
    ('18', '02428', 'Xã Vĩnh Điều'),
    ('17', '02429', 'Xã Đức Quang'),
    ('19', '02430', 'Xã Võ Nhai'),
    ('08', '02431', 'Xã Ba Chẽ'),
    ('28', '02432', 'Xã Kông Bơ La'),
    ('28', '02433', 'Xã Ia Tôr'),
    ('23', '02434', 'Xã Đăk Pék'),
    ('17', '02435', 'Xã Hương Xuân'),
    ('28', '02436', 'Xã Albá'),
    ('02', '02437', 'Xã Tây Thái Ninh'),
    ('34', '02438', 'Xã Nà Hang'),
    ('23', '02439', 'Xã Thiện Tín'),
    ('09', '02440', 'Xã Bảo Nhai'),
    ('09', '02441', 'Xã Cảm Nhân'),
    ('19', '02442', 'Xã Trại Cau'),
    ('08', '02443', 'Xã Thống Nhất'),
    ('12', '02444', 'Xã Thăng Phú'),
    ('29', '02445', 'Xã Đam Rông 1'),
    ('31', '02446', 'Xã Púng Bánh'),
    ('13', '02447', 'Xã Chất Bình'),
    ('33', '02448', 'Xã Vĩnh Lợi'),
    ('34', '02449', 'Xã Hùng An'),
    ('08', '02450', 'Xã Đường Hoa'),
    ('10', '02451', 'Xã Biển Động'),
    ('29', '02452', 'Xã Đam Rông 4'),
    ('06', '02453', 'Xã Vĩnh Chân'),
    ('03', '02454', 'Xã Mỹ Thủy'),
    ('28', '02455', 'Xã Ia Khươl'),
    ('31', '02456', 'Xã Chiềng Sơ'),
    ('23', '02457', 'Xã Sơn Linh'),
    ('31', '02458', 'Xã Bình Thuận'),
    ('17', '02459', 'Xã Hồng Lộc'),
    ('10', '02460', 'Xã Nam Dương'),
    ('17', '02461', 'Xã Việt Xuyên'),
    ('27', '02462', 'Xã Yang Mao'),
    ('10', '02463', 'Xã Cao Đức'),
    ('22', '02464', 'Xã Minh Đức'),
    ('09', '02465', 'Xã Phong Hải'),
    ('06', '02466', 'Xã Bằng Luân'),
    ('26', '02467', 'Xã Khổng Lào'),
    ('20', '02468', 'Xã Bắc Sơn'),
    ('24', '02469', 'Xã Phú Thuận'),
    ('15', '02470', 'Xã Mộc Hoá'),
    ('34', '02471', 'Xã Kim Bình'),
    ('24', '02472', 'Xã Hòa Minh'),
    ('28', '02473', 'Xã Canh Vinh'),
    ('34', '02474', 'Xã Sà Phìn'),
    ('15', '02475', 'Xã Tân Lập'),
    ('15', '02476', 'Xã Thạnh Hóa'),
    ('23', '02477', 'Xã Sa Bình'),
    ('21', '02478', 'Xã Nà Hỳ'),
    ('02', '02479', 'Xã Ái Quốc'),
    ('14', '02480', 'Xã Diên Thọ'),
    ('25', '02481', 'Xã Quảng Uyên'),
    ('27', '02482', 'Xã Cư Yang'),
    ('31', '02483', 'Xã Nậm Ty'),
    ('29', '02484', 'Xã Suối Kiết'),
    ('28', '02485', 'Xã Ia Dreh'),
    ('07', '02486', 'Xã Điền Quang'),
    ('03', '02487', 'Xã Hải Lăng'),
    ('20', '02488', 'Xã Yên Phúc'),
    ('02', '02489', 'Xã Tây Thụy Anh'),
    ('23', '02490', 'Xã Bình Chương'),
    ('34', '02491', 'Xã Bằng Hành'),
    ('10', '02492', 'Xã Lục Sơn'),
    ('34', '02493', 'Xã Lũng Phìn'),
    ('31', '02494', 'Xã Bó Sinh'),
    ('09', '02495', 'Xã Lâm Giang'),
    ('06', '02496', 'Xã Minh Hòa'),
    ('34', '02497', 'Xã Thắng Mố'),
    ('07', '02498', 'Xã Xuân Bình'),
    ('34', '02499', 'Xã Thái Sơn'),
    ('24', '02500', 'Xã Long Vĩnh'),
    ('26', '02501', 'Xã Sin Suối Hồ'),
    ('03', '02502', 'Xã Trung Thuần'),
    ('06', '02503', 'Xã Lai Đồng'),
    ('29', '02504', 'Xã Ninh Gia'),
    ('25', '02505', 'Xã Nam Tuấn'),
    ('29', '02506', 'Xã Hàm Thạnh'),
    ('29', '02507', 'Xã Đam Rông 2'),
    ('19', '02508', 'Xã Chợ Đồn'),
    ('19', '02509', 'Xã Nam Hòa'),
    ('27', '02510', 'Xã Ea H’leo'),
    ('08', '02511', 'Xã Bình Liêu'),
    ('11', '02512', 'Xã Anh Sơn Đông'),
    ('26', '02513', 'Xã Tủa Sín Chải'),
    ('27', '02514', 'Xã Xuân Phước'),
    ('26', '02515', 'Xã Sì Lở Lầu'),
    ('09', '02516', 'Xã Quy Mông'),
    ('34', '02517', 'Xã Phù Lưu'),
    ('24', '02518', 'Phường Trường Long Hòa'),
    ('31', '02519', 'Xã Mường Giôn'),
    ('06', '02520', 'Xã Trạm Thản'),
    ('26', '02521', 'Xã Dào San'),
    ('10', '02522', 'Xã Biên Sơn'),
    ('06', '02523', 'Xã Thượng Long'),
    ('19', '02524', 'Xã Bình Yên'),
    ('05', '02525', 'Phường Nguyễn Trãi'),
    ('07', '02526', 'Xã Luận Thành'),
    ('06', '02527', 'Xã Yên Sơn'),
    ('21', '02528', 'Xã Mường Phăng'),
    ('14', '02529', 'Xã Diên Lâm'),
    ('03', '02530', 'Xã Bến Hải'),
    ('17', '02531', 'Xã Kỳ Hoa'),
    ('34', '02532', 'Xã Yên Nguyên'),
    ('17', '02533', 'Xã Thạch Xuân'),
    ('21', '02534', 'Xã Mường Luân'),
    ('22', '02535', 'Xã Phú Lý'),
    ('28', '02536', 'Xã Gào'),
    ('27', '02537', 'Xã Xuân Lãnh'),
    ('22', '02538', 'Xã Nam Cát Tiên'),
    ('31', '02539', 'Phường Vân Sơn'),
    ('06', '02540', 'Xã Vân Bán'),
    ('06', '02541', 'Xã Đồng Lương'),
    ('27', '02542', 'Xã Đức Bình'),
    ('31', '02543', 'Xã Song Khủa'),
    ('29', '02544', 'Xã Đam Rông 3'),
    ('34', '02545', 'Xã Du Già'),
    ('17', '02546', 'Xã Kỳ Thượng'),
    ('21', '02547', 'Xã Sính Phình'),
    ('34', '02548', 'Xã Pà Vầy Sủ'),
    ('30', '02549', 'Xã Phước Thành'),
    ('14', '02550', 'Xã Mỹ Sơn'),
    ('23', '02551', 'Xã Dục Nông'),
    ('07', '02552', 'Xã Thạch Quảng'),
    ('21', '02553', 'Xã Xa Dung'),
    ('27', '02554', 'Xã Ea Riêng'),
    ('21', '02555', 'Xã Thanh Yên'),
    ('31', '02556', 'Xã Mường Lầm'),
    ('34', '02557', 'Xã Hoàng Su Phì'),
    ('31', '02558', 'Xã Muổi Nọi'),
    ('03', '02559', 'Xã Tuyên Bình'),
    ('34', '02560', 'Xã Phố Bảng'),
    ('33', '02561', 'Xã Vĩnh Mỹ'),
    ('31', '02562', 'Xã Tạ Khoa'),
    ('29', '02563', 'Xã Vĩnh Hảo'),
    ('09', '02564', 'Xã Yên Thành'),
    ('06', '02565', 'Xã Phú Mỹ'),
    ('24', '02566', 'Xã Long Thành'),
    ('06', '02567', 'Xã Toàn Thắng'),
    ('34', '02568', 'Phường Nông Tiến'),
    ('21', '02569', 'Xã Chiềng Sinh'),
    ('09', '02570', 'Xã Phúc Lợi'),
    ('22', '02571', 'Xã Lộc Thành'),
    ('21', '02572', 'Xã Na Son'),
    ('15', '02573', 'Xã Tuyên Thạnh'),
    ('24', '02574', 'Xã Long Hữu'),
    ('11', '02575', 'Xã Quỳnh Thắng'),
    ('34', '02576', 'Xã Bạch Xa'),
    ('06', '02577', 'Xã Thọ Văn'),
    ('33', '02578', 'Xã An Trạch'),
    ('25', '02579', 'Xã Quảng Lâm'),
    ('04', '02580', 'Xã Bình Điền'),
    ('34', '02581', 'Xã Tân Mỹ'),
    ('07', '02582', 'Xã Quý Lương'),
    ('34', '02583', 'Xã Lũng Cú'),
    ('06', '02584', 'Xã Xuân Đài'),
    ('06', '02585', 'Xã Quảng Yên'),
    ('27', '02586', 'Xã Ea Păl'),
    ('29', '02587', 'Xã Cát Tiên 2'),
    ('31', '02588', 'Phường Mộc Sơn'),
    ('25', '02589', 'Xã Hạnh Phúc'),
    ('20', '02590', 'Xã Bình Gia'),
    ('17', '02591', 'Xã Vũ Quang'),
    ('06', '02592', 'Xã Cự Đồng'),
    ('07', '02593', 'Xã Yên Phú'),
    ('21', '02594', 'Xã Nà Tấu'),
    ('12', '02595', 'Xã Hiệp Đức'),
    ('29', '02596', 'Xã Đạ Huoai 2'),
    ('29', '02597', 'Xã Lạc Dương'),
    ('34', '02598', 'Xã Tân Trào'),
    ('28', '02599', 'Xã Đak Sơmei'),
    ('09', '02600', 'Xã Gia Hội'),
    ('08', '02601', 'Phường Tuần Châu'),
    ('34', '02602', 'Xã Yên Phú'),
    ('21', '02603', 'Xã Quài Tở'),
    ('31', '02604', 'Xã Mường É'),
    ('12', '02605', 'Xã Lãnh Ngọc'),
    ('20', '02606', 'Xã Thiện Tân'),
    ('10', '02607', 'Xã Tân Sơn'),
    ('20', '02608', 'Xã Yên Bình'),
    ('09', '02609', 'Xã Mù Cang Chải'),
    ('17', '02610', 'Xã Sơn Tây'),
    ('33', '02611', 'Xã Hưng Hội'),
    ('14', '02612', 'Xã Công Hải'),
    ('27', '02613', 'Xã Đắk Phơi'),
    ('31', '02614', 'Xã Tô Múa'),
    ('09', '02615', 'Xã Thượng Bằng La'),
    ('10', '02616', 'Xã Đèo Gia'),
    ('03', '02617', 'Xã Đakrông'),
    ('19', '02618', 'Xã Tràng Xá'),
    ('29', '02619', 'Xã Đạ Tẻh 2'),
    ('31', '02620', 'Xã Co Mạ'),
    ('19', '02621', 'Xã Chợ Rã'),
    ('11', '02622', 'Xã Tiền Phong'),
    ('31', '02623', 'Xã Phiêng Cằm'),
    ('09', '02624', 'Xã Pha Long'),
    ('33', '02625', 'Xã Ninh Thạnh Lợi'),
    ('11', '02626', 'Xã Tri Lễ'),
    ('06', '02627', 'Xã Xuân Viên'),
    ('03', '02628', 'Xã Tân Lập'),
    ('15', '02629', 'Xã Hoà Hội'),
    ('28', '02630', 'Xã Pờ Tó'),
    ('34', '02631', 'Xã Đường Thượng'),
    ('03', '02632', 'Xã Lìa'),
    ('21', '02633', 'Xã Mường Mùn'),
    ('28', '02634', 'Xã Hra'),
    ('25', '02635', 'Xã Phục Hòa'),
    ('20', '02636', 'Xã Thống Nhất'),
    ('06', '02637', 'Phường Tân Hòa'),
    ('28', '02638', 'Xã Hội Sơn'),
    ('17', '02639', 'Xã Hương Đô'),
    ('09', '02640', 'Xã Khánh Yên'),
    ('11', '02641', 'Xã Mường Ham'),
    ('34', '02642', 'Xã Tiên Yên'),
    ('24', '02643', 'Xã Đông Hải'),
    ('19', '02644', 'Xã Chợ Mới'),
    ('25', '02645', 'Xã Bảo Lâm'),
    ('20', '02646', 'Xã Vạn Linh'),
    ('28', '02647', 'Xã An Hòa'),
    ('31', '02648', 'Xã Chiềng Sung'),
    ('12', '02649', 'Xã Quế Phước'),
    ('09', '02650', 'Xã Thượng Hà'),
    ('11', '02651', 'Xã Giai Xuân'),
    ('31', '02652', 'Xã Chiềng Sơn'),
    ('20', '02653', 'Xã Na Sầm'),
    ('15', '02654', 'Xã Tân Long'),
    ('31', '02655', 'Xã Tường Hạ'),
    ('09', '02656', 'Xã Hưng Khánh'),
    ('31', '02657', 'Xã Mường Chiên'),
    ('09', '02658', 'Xã Cao Sơn'),
    ('26', '02659', 'Xã Sìn Hồ'),
    ('28', '02660', 'Xã Kim Sơn'),
    ('33', '02661', 'Xã Ninh Quới'),
    ('07', '02662', 'Xã Thượng Ninh'),
    ('19', '02663', 'Xã Bằng Thành'),
    ('20', '02664', 'Xã Quốc Khánh'),
    ('26', '02665', 'Xã Mường Than'),
    ('09', '02666', 'Xã Nghĩa Đô'),
    ('21', '02667', 'Xã Mường Chà'),
    ('19', '02668', 'Xã Trung Hội'),
    ('28', '02669', 'Xã Vân Canh'),
    ('28', '02670', 'Xã Ia Ly'),
    ('33', '02671', 'Xã Hồng Dân'),
    ('34', '02672', 'Xã Thái Bình'),
    ('27', '02673', 'Xã Cư Prao'),
    ('09', '02674', 'Xã Hạnh Phúc'),
    ('11', '02675', 'Xã Hạnh Lâm'),
    ('31', '02676', 'Xã Tà Hộc'),
    ('23', '02677', 'Xã Đăk Môn'),
    ('13', '02678', 'Xã Phú Long'),
    ('20', '02679', 'Xã Bằng Mạc'),
    ('27', '02680', 'Xã Cư M’ta'),
    ('22', '02681', 'Xã Phú Trung'),
    ('15', '02682', 'Xã Bình Hoà'),
    ('20', '02683', 'Xã Vũ Lăng'),
    ('33', '02684', 'Xã Phong Hiệp'),
    ('21', '02685', 'Xã Mường Lạn'),
    ('07', '02686', 'Xã Như Xuân'),
    ('09', '02687', 'Xã Châu Quế'),
    ('03', '02688', 'Xã Hướng Hiệp'),
    ('34', '02689', 'Xã Minh Thanh'),
    ('20', '02690', 'Xã Khánh Khê'),
    ('26', '02691', 'Xã Hồng Thu'),
    ('23', '02692', 'Xã Kon Đào'),
    ('19', '02693', 'Xã Phủ Thông'),
    ('09', '02694', 'Xã Liên Sơn'),
    ('19', '02695', 'Xã Phượng Tiến'),
    ('24', '02696', 'Xã Long Hòa'),
    ('09', '02697', 'Xã Tú Lệ'),
    ('31', '02698', 'Xã Pắc Ngà'),
    ('07', '02699', 'Xã Thiết Ống'),
    ('34', '02700', 'Xã Hoà An'),
    ('11', '02701', 'Xã Mậu Thạch'),
    ('19', '02702', 'Xã Đức Lương'),
    ('06', '02703', 'Xã Khả Cửu'),
    ('19', '02704', 'Xã Quân Chu'),
    ('29', '02705', 'Xã Tà Năng'),
    ('33', '02706', 'Xã Định Thành'),
    ('34', '02707', 'Xã Bắc Mê'),
    ('13', '02708', 'Xã Gia Phong'),
    ('15', '02709', 'Xã Vĩnh Châu'),
    ('11', '02710', 'Xã Tam Quang'),
    ('09', '02711', 'Xã Xuân Hòa'),
    ('20', '02712', 'Xã Vũ Lễ'),
    ('21', '02713', 'Xã Sín Chải'),
    ('27', '02714', 'Xã Tuy An Tây'),
    ('27', '02715', 'Xã Krông Á'),
    ('04', '02716', 'Xã Khe Tre'),
    ('17', '02717', 'Xã Kỳ Lạc'),
    ('16', '02718', 'Xã Tân Phước 1'),
    ('31', '02719', 'Xã Mường Bang'),
    ('25', '02720', 'Xã Yên Thổ'),
    ('19', '02721', 'Xã Cao Minh'),
    ('07', '02722', 'Xã Tân Thành'),
    ('26', '02723', 'Xã Nậm Tăm'),
    ('34', '02724', 'Xã Bạch Đích'),
    ('25', '02725', 'Xã Trường Hà'),
    ('29', '02726', 'Xã Đắk song'),
    ('28', '02727', 'Xã Ayun'),
    ('09', '02728', 'Xã Lương Thịnh'),
    ('23', '02729', 'Xã Sa Loong'),
    ('11', '02730', 'Xã Hùng Chân'),
    ('23', '02731', 'Xã Sơn Thủy'),
    ('26', '02732', 'Xã Tả Lèng'),
    ('17', '02733', 'Xã Hà Linh'),
    ('31', '02734', 'Xã Yên Sơn'),
    ('15', '02735', 'Xã Vĩnh Thạnh'),
    ('11', '02736', 'Xã Hữu Kiệm'),
    ('27', '02737', 'Xã Dur Kmăl'),
    ('34', '02738', 'Xã Sủng Máng'),
    ('21', '02739', 'Xã Pú Nhung'),
    ('25', '02740', 'Xã Đoài Dương'),
    ('07', '02741', 'Xã Thanh Kỳ'),
    ('26', '02742', 'Xã Mường Khoa'),
    ('09', '02743', 'Xã Sơn Lương'),
    ('09', '02744', 'Xã Hợp Thành'),
    ('10', '02745', 'Xã Dương Hưu'),
    ('33', '02746', 'Xã Châu Thới'),
    ('07', '02747', 'Xã Linh Sơn'),
    ('22', '02748', 'Xã Hưng Phước'),
    ('34', '02749', 'Xã Tân Quang'),
    ('31', '02750', 'Xã Phiêng Khoài'),
    ('06', '02751', 'Xã Bao La'),
    ('04', '02752', 'Xã A Lưới 1'),
    ('34', '02753', 'Xã Lâm Bình'),
    ('09', '02754', 'Xã Trịnh Tường'),
    ('31', '02755', 'Xã Huổi Một'),
    ('11', '02756', 'Xã Sơn Lâm'),
    ('25', '02757', 'Xã Đàm Thuỷ'),
    ('34', '02758', 'Xã Trung Thịnh'),
    ('14', '02759', 'Xã Bác Ái'),
    ('34', '02760', 'Xã Phú Linh'),
    ('19', '02761', 'Xã La Hiên'),
    ('23', '02762', 'Xã Ba Tơ'),
    ('34', '02763', 'Xã Niêm Sơn'),
    ('11', '02764', 'Xã Châu Khê'),
    ('34', '02765', 'Xã Bằng Lang'),
    ('09', '02766', 'Xã Dền Sáng'),
    ('10', '02767', 'Xã Đại Sơn'),
    ('09', '02768', 'Xã Lùng Phình'),
    ('20', '02769', 'Xã Hưng Vũ'),
    ('07', '02770', 'Xã Thanh Quân'),
    ('27', '02771', 'Xã Ea Ly'),
    ('23', '02772', 'Xã Đăk Ui'),
    ('23', '02773', 'Xã Sơn Kỳ'),
    ('34', '02774', 'Xã Vĩnh Tuy'),
    ('33', '02775', 'Xã Vĩnh Lộc'),
    ('03', '02776', 'Xã Hướng Phùng'),
    ('20', '02777', 'Xã Cai Kinh'),
    ('31', '02778', 'Xã Ngọc Chiến'),
    ('11', '02779', 'Xã Thành Bình Thọ'),
    ('07', '02780', 'Xã Hóa Quỳ'),
    ('34', '02781', 'Xã Nấm Dẩn'),
    ('23', '02782', 'Xã Ngọk Réo'),
    ('07', '02783', 'Xã Đồng Lương'),
    ('33', '02784', 'Phường Hiệp Thành'),
    ('11', '02785', 'Xã Châu Hồng'),
    ('25', '02786', 'Xã Lý Bôn'),
    ('21', '02787', 'Xã Núa Ngam'),
    ('19', '02788', 'Xã Ba Bể'),
    ('19', '02789', 'Xã Phú Đình'),
    ('19', '02790', 'Xã Đồng Phúc'),
    ('26', '02791', 'Xã Bum Tở'),
    ('08', '02792', 'Xã Quảng Đức'),
    ('29', '02793', 'Xã Đạ Tẻh 3'),
    ('34', '02794', 'Xã Đường Hồng'),
    ('23', '02795', 'Xã Tây Trà'),
    ('26', '02796', 'Xã Pu Sam Cáp'),
    ('29', '02797', 'Xã Bảo Lâm 5'),
    ('20', '02798', 'Xã Chiến Thắng'),
    ('29', '02799', 'Xã Hòa Thắng'),
    ('14', '02800', 'Xã Khánh Sơn'),
    ('17', '02801', 'Xã Đức Đồng'),
    ('20', '02802', 'Xã Tràng Định'),
    ('19', '02803', 'Xã Bình Thành'),
    ('09', '02804', 'Xã Tân Hợp'),
    ('19', '02805', 'Xã Na Rì'),
    ('09', '02806', 'Xã Trạm Tấu'),
    ('20', '02807', 'Xã Tân Tri'),
    ('20', '02808', 'Xã Nhất Hòa'),
    ('27', '02809', 'Xã Suối Trai'),
    ('23', '02810', 'Xã Ba Vì'),
    ('09', '02811', 'Xã Cát Thịnh'),
    ('19', '02812', 'Xã Cẩm Giàng'),
    ('20', '02813', 'Xã Điềm He'),
    ('06', '02814', 'Xã Pà Cò'),
    ('06', '02815', 'Xã Thu Cúc'),
    ('28', '02816', 'Xã Ia O'),
    ('34', '02817', 'Xã Hồng Thái'),
    ('11', '02818', 'Xã Mường Chọng'),
    ('31', '02819', 'Xã Mường Chanh'),
    ('34', '02820', 'Xã Tùng Vài'),
    ('26', '02821', 'Xã Nậm Hàng'),
    ('14', '02822', 'Xã Khánh Vĩnh'),
    ('31', '02823', 'Xã Tà Xùa'),
    ('23', '02824', 'Xã Đông Trà Bồng'),
    ('23', '02825', 'Xã Đăk Pxi'),
    ('29', '02826', 'Xã Quảng Trực'),
    ('31', '02827', 'Xã Lóng Phiêng'),
    ('33', '02828', 'Xã Phong Thạnh'),
    ('28', '02829', 'Xã Sơn Lang'),
    ('19', '02830', 'Xã Kim Phượng'),
    ('14', '02831', 'Xã Bác Ái Tây'),
    ('09', '02832', 'Xã Cốc San'),
    ('20', '02833', 'Xã Nhân Lý'),
    ('34', '02834', 'Xã Tân An'),
    ('17', '02835', 'Xã Mai Hoa'),
    ('03', '02836', 'Xã A Dơi'),
    ('27', '02837', 'Xã Tây Sơn'),
    ('19', '02838', 'Xã Nghiên Loan'),
    ('11', '02839', 'Xã Châu Bình'),
    ('19', '02840', 'Xã Thượng Minh'),
    ('34', '02841', 'Xã Lực Hành'),
    ('25', '02842', 'Xã Hà Quảng'),
    ('29', '02843', 'Xã Nam Hà - Lâm Hà'),
    ('34', '02844', 'Xã Tân Long'),
    ('34', '02845', 'Xã Lùng Tám'),
    ('09', '02846', 'Xã Phình Hồ'),
    ('34', '02847', 'Xã Trung Sơn'),
    ('28', '02848', 'Xã Tơ Tung'),
    ('31', '02849', 'Xã Mường Lạn'),
    ('25', '02850', 'Xã Bảo Lạc'),
    ('34', '02851', 'Xã Hùng Lợi'),
    ('16', '02852', 'Xã Tân Phước 2'),
    ('28', '02853', 'Xã Vĩnh Thịnh'),
    ('19', '02854', 'Xã Quang Sơn'),
    ('21', '02855', 'Xã Mường Toong'),
    ('19', '02856', 'Xã Hợp Thành'),
    ('25', '02857', 'Xã Trà Lĩnh'),
    ('09', '02858', 'Xã Việt Hồng'),
    ('26', '02859', 'Xã Nậm Cuổi'),
    ('19', '02860', 'Xã Nam Cường'),
    ('27', '02861', 'Xã Xuân Thọ'),
    ('34', '02862', 'Xã Tân Trịnh'),
    ('25', '02863', 'Xã Đình Phong'),
    ('21', '02864', 'Xã Si Pa Phìn'),
    ('04', '02865', 'Xã A Lưới 4'),
    ('31', '02866', 'Xã Mường Bám'),
    ('23', '02867', 'Xã Ya Ly'),
    ('26', '02868', 'Xã Pắc Ta'),
    ('28', '02869', 'Xã An Lão'),
    ('15', '02870', 'Xã Bình Thành'),
    ('26', '02871', 'Xã Khoen On'),
    ('03', '02872', 'Xã Tà Rụt'),
    ('34', '02873', 'Xã Quang Bình'),
    ('34', '02874', 'Xã Đồng Tâm'),
    ('10', '02875', 'Xã Tây Yên Tử'),
    ('06', '02876', 'Xã Thung Nai'),
    ('26', '02877', 'Xã Nậm Sỏ'),
    ('29', '02878', 'Xã Cát Tiên 3'),
    ('20', '02879', 'Xã Tân Đoàn'),
    ('34', '02880', 'Xã Liên Hiệp'),
    ('06', '02881', 'Xã Tân Pheo'),
    ('12', '02882', 'Xã Trà Đốc'),
    ('21', '02883', 'Xã Phình Giàng'),
    ('07', '02884', 'Xã Hồi Xuân'),
    ('08', '02885', 'Xã Hải Ninh'),
    ('20', '02886', 'Xã Ba Sơn'),
    ('21', '02887', 'Xã Mường Pồn'),
    ('11', '02888', 'Xã Mường Xén'),
    ('34', '02889', 'Xã Tân Tiến'),
    ('14', '02890', 'Xã Đông Khánh Sơn'),
    ('25', '02891', 'Xã Cần Yên'),
    ('34', '02892', 'Xã Hùng Đức'),
    ('19', '02893', 'Xã Phúc Lộc'),
    ('22', '02894', 'Xã Lộc Thạnh'),
    ('06', '02895', 'Xã Mai Hạ'),
    ('12', '02896', 'Xã Tam Hải'),
    ('09', '02897', 'Xã Y Tý'),
    ('27', '02898', 'Xã Krông Nô'),
    ('14', '02899', 'Xã Anh Dũng'),
    ('34', '02900', 'Xã Yên Lập'),
    ('14', '02901', 'Xã Nam Khánh Vĩnh'),
    ('25', '02902', 'Xã Bế Văn Đàn'),
    ('34', '02903', 'Xã Bình An'),
    ('28', '02904', 'Xã Ia Rbol'),
    ('25', '02905', 'Xã Nam Quang'),
    ('09', '02906', 'Xã Lao Chải'),
    ('25', '02907', 'Xã Cốc Pàng'),
    ('31', '02908', 'Xã Xuân Nha'),
    ('21', '02909', 'Xã Nà Bủng'),
    ('07', '02910', 'Xã Văn Nho'),
    ('23', '02911', 'Xã Minh Long'),
    ('29', '02912', 'Xã Bảo Lâm 4'),
    ('20', '02913', 'Xã Tri Lễ'),
    ('28', '02914', 'Xã Vĩnh Thạnh'),
    ('09', '02915', 'Xã Mỏ Vàng'),
    ('21', '02916', 'Xã Quảng Lâm'),
    ('09', '02917', 'Xã Nậm Có'),
    ('17', '02918', 'Xã Thượng Đức'),
    ('21', '02919', 'Xã Pu Nhi'),
    ('34', '02920', 'Xã Ngọc Long'),
    ('08', '02921', 'Xã Lục Hồn'),
    ('28', '02922', 'Xã Kon Chiêng'),
    ('20', '02923', 'Xã Văn Quan'),
    ('09', '02924', 'Xã Tả Phìn'),
    ('20', '02925', 'Xã Đình Lập'),
    ('34', '02926', 'Xã Nghĩa Thuận'),
    ('23', '02927', 'Xã Sơn Mai'),
    ('34', '02928', 'Xã Thượng Lâm'),
    ('31', '02929', 'Xã Kim Bon'),
    ('23', '02930', 'Xã Sơn Tây'),
    ('08', '02931', 'Xã Hải Lạng'),
    ('34', '02932', 'Xã Cán Tỷ'),
    ('11', '02933', 'Xã Chiêu Lưu'),
    ('34', '02934', 'Xã Bản Máy'),
    ('03', '02935', 'Xã Kim Ngân'),
    ('34', '02936', 'Xã Yên Cường'),
    ('12', '02937', 'Xã Khâm Đức'),
    ('07', '02938', 'Xã Cổ Lũng'),
    ('27', '02939', 'Xã Ea Bung'),
    ('34', '02940', 'Xã Bạch Ngọc'),
    ('20', '02941', 'Xã Mẫu Sơn'),
    ('21', '02942', 'Xã Mường Nhà'),
    ('31', '02943', 'Xã Lóng Sập'),
    ('07', '02944', 'Xã Thanh Phong'),
    ('10', '02945', 'Xã Sơn Hải'),
    ('07', '02946', 'Xã Lương Sơn'),
    ('07', '02947', 'Xã Pù Luông'),
    ('31', '02948', 'Xã Mường Sại'),
    ('23', '02949', 'Xã Ba Tô'),
    ('11', '02950', 'Xã Na Ngoi'),
    ('03', '02951', 'Xã Dân Hóa'),
    ('11', '02952', 'Xã Yên Na'),
    ('29', '02953', 'Xã Tuy Phong'),
    ('19', '02954', 'Xã Văn Lăng'),
    ('20', '02955', 'Xã Tân Văn'),
    ('26', '02956', 'Xã Bản Bo'),
    ('28', '02957', 'Xã Chư Krey'),
    ('06', '02958', 'Xã Quy Đức'),
    ('25', '02959', 'Xã Thông Nông'),
    ('21', '02960', 'Xã Mường Tùng'),
    ('03', '02961', 'Xã Bến Quan'),
    ('23', '02962', 'Xã Măng Đen'),
    ('29', '02963', 'Xã La Dạ'),
    ('13', '02964', 'Xã Kim Đông'),
    ('25', '02965', 'Xã Hưng Đạo'),
    ('34', '02966', 'Xã Kiên Đài'),
    ('09', '02967', 'Xã Bản Hồ'),
    ('25', '02968', 'Xã Nguyễn Huệ'),
    ('09', '02969', 'Xã Khao Mang'),
    ('10', '02970', 'Xã Yên Định'),
    ('14', '02971', 'Xã Bác Ái Đông'),
    ('23', '02972', 'Xã Kon Plông'),
    ('09', '02973', 'Xã Chiềng Ken'),
    ('07', '02974', 'Xã Trung Hạ'),
    ('20', '02975', 'Xã Khuất Xá'),
    ('25', '02976', 'Xã Nguyên Bình'),
    ('12', '02977', 'Xã Đức Phú'),
    ('34', '02978', 'Xã Xuân Giang'),
    ('19', '02979', 'Xã Nà Phặc'),
    ('14', '02980', 'Xã Bắc Khánh Vĩnh'),
    ('06', '02981', 'Xã Vân Sơn'),
    ('08', '02982', 'Xã Quảng La'),
    ('04', '02983', 'Xã Nam Đông'),
    ('28', '02984', 'Xã Ia Dom'),
    ('09', '02985', 'Xã Minh Lương'),
    ('26', '02986', 'Xã Khun Há'),
    ('26', '02987', 'Xã Lê Lợi'),
    ('23', '02988', 'Xã Măng Bút'),
    ('25', '02989', 'Xã Đông Khê'),
    ('28', '02990', 'Xã Vĩnh Quang'),
    ('12', '02991', 'Xã Thạnh Mỹ'),
    ('28', '02992', 'Xã Ia Chia'),
    ('26', '02993', 'Xã Pa Tần'),
    ('08', '02994', 'Xã Hoành Mô'),
    ('27', '02995', 'Xã Phú Mỡ'),
    ('06', '02996', 'Xã Ngọc Sơn'),
    ('21', '02997', 'Xã Nậm Kè'),
    ('04', '02998', 'Xã A Lưới 3'),
    ('21', '02999', 'Xã Tủa Thàng'),
    ('09', '03000', 'Xã Dương Quỳ'),
    ('23', '03001', 'Xã Đăk Tờ Kan'),
    ('14', '03002', 'Xã Phước Hà'),
    ('07', '03003', 'Xã Thắng Lộc'),
    ('04', '03004', 'Xã Long Quảng'),
    ('06', '03005', 'Xã Cao Sơn'),
    ('12', '03006', 'Xã Đông Giang'),
    ('28', '03007', 'Xã Ya Ma'),
    ('19', '03008', 'Xã Thanh Thịnh'),
    ('09', '03009', 'Xã Cốc Lầu'),
    ('20', '03010', 'Xã Hữu Liên'),
    ('28', '03011', 'Xã Ya Hội'),
    ('12', '03012', 'Xã Sông Kôn'),
    ('34', '03013', 'Xã Hồ Thầu'),
    ('06', '03014', 'Xã Long Cốc'),
    ('11', '03015', 'Xã Nậm Cắn'),
    ('23', '03016', 'Xã Măng Ri'),
    ('34', '03017', 'Xã Tri Phú'),
    ('28', '03018', 'Xã Ia Nan'),
    ('13', '03019', 'Xã Cúc Phương'),
    ('12', '03020', 'Xã Tây Giang'),
    ('29', '03021', 'Xã Quảng Hòa'),
    ('06', '03022', 'Xã Mường Hoa'),
    ('09', '03023', 'Xã Bản Xèo'),
    ('34', '03024', 'Xã Nậm Dịch'),
    ('09', '03025', 'Xã Phúc Khánh'),
    ('07', '03026', 'Xã Văn Phú'),
    ('03', '03027', 'Xã Trường Sơn'),
    ('11', '03028', 'Xã Thông Thụ'),
    ('31', '03029', 'Xã Long Hẹ'),
    ('11', '03030', 'Xã Nga My'),
    ('23', '03031', 'Xã Ngọk Tụ'),
    ('12', '03032', 'Xã Phước Năng'),
    ('11', '03033', 'Xã Yên Hòa'),
    ('17', '03034', 'Xã Sơn Hồng'),
    ('03', '03035', 'Xã Tuyên Lâm'),
    ('25', '03036', 'Xã Độc Lập'),
    ('28', '03037', 'Xã Ia Sao'),
    ('25', '03038', 'Xã Cô Ba'),
    ('12', '03039', 'Xã Trà Tập'),
    ('20', '03040', 'Xã Thái Bình'),
    ('10', '03041', 'Xã An Lạc'),
    ('07', '03042', 'Xã Giao An'),
    ('27', '03043', 'Xã Ea Bá'),
    ('34', '03044', 'Xã Trung Hà'),
    ('12', '03045', 'Xã Bến Giằng'),
    ('22', '03046', 'Xã Bù Gia Mập'),
    ('19', '03047', 'Xã Ngân Sơn'),
    ('19', '03048', 'Xã Bạch Thông'),
    ('22', '03049', 'Xã Đak Lua'),
    ('34', '03050', 'Xã Tùng Bá'),
    ('28', '03051', 'Xã SRó'),
    ('23', '03052', 'Xã Đăk Rve'),
    ('21', '03053', 'Xã Sam Mứn'),
    ('25', '03054', 'Xã Minh Tâm'),
    ('21', '03055', 'Xã Pa Ham'),
    ('03', '03056', 'Xã La Lay'),
    ('25', '03057', 'Xã Hạ Lang'),
    ('23', '03058', 'Xã Tây Trà Bồng'),
    ('19', '03059', 'Xã Lam Vỹ'),
    ('09', '03060', 'Xã Phong Dụ Hạ'),
    ('34', '03061', 'Xã Khuôn Lùng'),
    ('20', '03062', 'Xã Kiên Mộc'),
    ('26', '03063', 'Xã Tà Tổng'),
    ('12', '03064', 'Xã Hùng Sơn'),
    ('06', '03065', 'Xã Tân Mai'),
    ('34', '03066', 'Xã Thuận Hoà'),
    ('34', '03067', 'Xã Minh Ngọc'),
    ('34', '03068', 'Xã Ngọc Đường'),
    ('14', '03069', 'Xã Tây Khánh Sơn'),
    ('19', '03070', 'Xã Nghĩa Tá'),
    ('14', '03071', 'Xã Trung Khánh Vĩnh'),
    ('34', '03072', 'Xã Tát Ngà'),
    ('28', '03073', 'Xã Chơ Long'),
    ('34', '03074', 'Xã Minh Sơn'),
    ('11', '03075', 'Xã Tam Thái'),
    ('19', '03076', 'Xã Tân Kỳ'),
    ('20', '03077', 'Xã Văn Lãng'),
    ('23', '03078', 'Xã Ba Động'),
    ('34', '03079', 'Xã Thàng Tín'),
    ('31', '03080', 'Xã Xím Vàng'),
    ('25', '03081', 'Xã Thạch An'),
    ('07', '03082', 'Xã Xuân Chinh'),
    ('19', '03083', 'Xã Văn Lang'),
    ('07', '03084', 'Xã Quan Sơn'),
    ('09', '03085', 'Xã Ngũ Chỉ Sơn'),
    ('21', '03086', 'Xã Nậm Nèn'),
    ('34', '03087', 'Xã Minh Tân'),
    ('20', '03088', 'Xã Hội Hoan'),
    ('29', '03089', 'Xã Phan Sơn'),
    ('23', '03090', 'Xã Thanh Bồng'),
    ('23', '03091', 'Xã Sơn Tây Thượng'),
    ('11', '03092', 'Xã Cam Phục'),
    ('19', '03093', 'Xã Thanh Mai'),
    ('12', '03094', 'Xã Trà Mai'),
    ('06', '03095', 'Xã Đức Nhàn'),
    ('19', '03096', 'Xã Yên Phong'),
    ('25', '03097', 'Xã Huy Giáp'),
    ('14', '03098', 'Xã Tây Khánh Vĩnh'),
    ('07', '03099', 'Xã Trung Lý'),
    ('26', '03100', 'Xã Mường Mô'),
    ('34', '03101', 'Xã Yên Hoa'),
    ('19', '03102', 'Xã Hiệp Lực'),
    ('29', '03103', 'Xã Sơn Điền'),
    ('20', '03104', 'Xã Thiện Thuật'),
    ('21', '03105', 'Xã Tìa Dình'),
    ('23', '03106', 'Xã Ba Dinh'),
    ('11', '03107', 'Xã Châu Lộc'),
    ('09', '03108', 'Xã Mường Bo'),
    ('25', '03109', 'Xã Lũng Nặm'),
    ('07', '03110', 'Xã Hiền Kiệt'),
    ('23', '03111', 'Xã Ia Tơi'),
    ('34', '03112', 'Xã Thượng Nông'),
    ('20', '03113', 'Xã Lợi Bác'),
    ('08', '03114', 'Đặc khu Cô Tô'),
    ('26', '03115', 'Xã Bum Nưa'),
    ('20', '03116', 'Xã Quan Sơn'),
    ('07', '03117', 'Xã Mường Lát'),
    ('12', '03118', 'Xã Trà Linh'),
    ('11', '03119', 'Xã Nhôn Mai'),
    ('12', '03120', 'Xã Trà Liên'),
    ('19', '03121', 'Xã Trần Phú'),
    ('19', '03122', 'Xã Yên Bình'),
    ('12', '03123', 'Xã Sông Vàng'),
    ('19', '03124', 'Xã Xuân Dương'),
    ('08', '03125', 'Xã Điền Xá'),
    ('12', '03126', 'Xã Phước Trà'),
    ('20', '03127', 'Xã Cao Lộc'),
    ('25', '03128', 'Xã Vinh Quý'),
    ('25', '03129', 'Xã Quang Hán'),
    ('20', '03130', 'Xã Thụy Hùng'),
    ('20', '03131', 'Xã Hồng Phong'),
    ('25', '03132', 'Xã Tổng Cọt'),
    ('27', '03133', 'Xã Ia Rvê'),
    ('09', '03134', 'Xã Mường Hum'),
    ('31', '03135', 'Xã Tân Phong'),
    ('34', '03136', 'Xã Kiến Thiết'),
    ('20', '03137', 'Xã Thiện Hòa'),
    ('03', '03138', 'Xã Tuyên Sơn'),
    ('31', '03139', 'Xã Chiềng Sại'),
    ('09', '03140', 'Xã Phong Dụ Thượng'),
    ('07', '03141', 'Xã Phú Lệ'),
    ('23', '03142', 'Xã Tu Mơ Rông'),
    ('23', '03143', 'Xã Đăk Sao'),
    ('27', '03144', 'Xã Vân Hòa'),
    ('07', '03145', 'Xã Yên Thắng'),
    ('25', '03146', 'Xã Phan Thanh'),
    ('01', '03147', 'Xã Minh Châu'),
    ('19', '03148', 'Xã Côn Minh'),
    ('20', '03149', 'Xã Xuân Dương'),
    ('12', '03150', 'Xã Trà Leng'),
    ('27', '03151', 'Xã Ea Trang'),
    ('27', '03152', 'Xã Buôn Đôn'),
    ('29', '03153', 'Xã Đạ Huoai 3'),
    ('25', '03154', 'Xã Khánh Xuân'),
    ('19', '03155', 'Xã Nghinh Tường'),
    ('09', '03156', 'Xã Tả Củ Tỷ'),
    ('28', '03157', 'Xã An Vinh'),
    ('23', '03158', 'Xã Xốp'),
    ('25', '03159', 'Xã Thanh Long'),
    ('20', '03160', 'Xã Công Sơn'),
    ('20', '03161', 'Xã Tân Tiến'),
    ('26', '03162', 'Xã Nậm Mạ'),
    ('30', '03163', 'Đặc khu Côn Đảo'),
    ('27', '03164', 'Xã Ia Lốp'),
    ('07', '03165', 'Xã Thiên Phủ'),
    ('23', '03166', 'Xã Ngọc Linh'),
    ('23', '03167', 'Xã Ba Vinh'),
    ('27', '03168', 'Xã Nam Ka'),
    ('34', '03169', 'Xã Việt Lâm'),
    ('32', '03170', 'Xã Phong Nẫm'),
    ('11', '03171', 'Xã Mường Típ'),
    ('10', '03172', 'Xã Tuấn Đạo'),
    ('23', '03173', 'Xã Rờ Kơi'),
    ('34', '03174', 'Xã Thanh Thuỷ'),
    ('23', '03175', 'Xã Mô Rai'),
    ('26', '03176', 'Xã Mường Tè'),
    ('10', '03177', 'Xã Sa Lý'),
    ('31', '03178', 'Xã Suối Tọ'),
    ('12', '03179', 'Xã Trà Tân'),
    ('28', '03180', 'Xã Đak Rong'),
    ('34', '03181', 'Xã Thông Nguyên'),
    ('34', '03182', 'Xã Pờ Ly Ngài'),
    ('34', '03183', 'Xã Giáp Trung'),
    ('03', '03184', 'Xã Kim Điền'),
    ('34', '03185', 'Xã Thượng Sơn'),
    ('19', '03186', 'Xã Phong Quang'),
    ('20', '03187', 'Xã Hoa Thám'),
    ('07', '03188', 'Xã Vạn Xuân'),
    ('07', '03189', 'Xã Tam Lư'),
    ('26', '03190', 'Xã Pa Ủ'),
    ('21', '03191', 'Xã Sín Thầu'),
    ('25', '03192', 'Xã Kim Đồng'),
    ('10', '03193', 'Xã Vân Sơn'),
    ('28', '03194', 'Xã Krong'),
    ('28', '03195', 'Xã Vĩnh Sơn'),
    ('06', '03196', 'Xã Trung Sơn'),
    ('19', '03197', 'Xã Thần Sa'),
    ('07', '03198', 'Xã Quang Chiểu'),
    ('25', '03199', 'Xã Quang Trung'),
    ('25', '03200', 'Xã Lý Quốc'),
    ('09', '03201', 'Xã A Mú Sung'),
    ('23', '03202', 'Xã Đăk Kôi'),
    ('34', '03203', 'Xã Quảng Nguyên'),
    ('20', '03204', 'Xã Châu Sơn'),
    ('12', '03205', 'Xã Trà Giáp'),
    ('07', '03206', 'Xã Pù Nhi'),
    ('28', '03207', 'Xã Ia Pnôn'),
    ('08', '03208', 'Xã Kỳ Thượng'),
    ('20', '03209', 'Xã Quốc Việt'),
    ('07', '03210', 'Xã Mường Lý'),
    ('25', '03211', 'Xã Tam Kim'),
    ('11', '03212', 'Xã Mỹ Lý'),
    ('07', '03213', 'Xã Nam Xuân'),
    ('25', '03214', 'Xã Tĩnh Túc'),
    ('17', '03215', 'Xã Sơn Kim 1'),
    ('20', '03216', 'Xã Thiện Long'),
    ('25', '03217', 'Xã Quang Long'),
    ('34', '03218', 'Xã Yên Thành'),
    ('34', '03219', 'Xã Côn Lôn'),
    ('08', '03220', 'Xã Hải Hòa'),
    ('19', '03221', 'Xã Cường Lợi'),
    ('09', '03222', 'Xã Sín Chéng'),
    ('26', '03223', 'Xã Hua Bum'),
    ('23', '03224', 'Xã Sơn Tây Hạ'),
    ('20', '03225', 'Xã Kháng Chiến'),
    ('07', '03226', 'Xã Yên Nhân'),
    ('25', '03227', 'Xã Xuân Trường'),
    ('11', '03228', 'Xã Mường Lống'),
    ('19', '03229', 'Xã Bằng Vân'),
    ('23', '03230', 'Xã Đăk Plô'),
    ('08', '03231', 'Xã Lương Minh'),
    ('09', '03232', 'Xã Nậm Chày'),
    ('25', '03233', 'Xã Sơn Lộ'),
    ('07', '03234', 'Xã Yên Khương'),
    ('11', '03235', 'Xã Bắc Lý'),
    ('03', '03236', 'Xã Tân Thành'),
    ('07', '03237', 'Xã Trung Thành'),
    ('19', '03238', 'Xã Yên Thịnh'),
    ('12', '03239', 'Xã Avương'),
    ('23', '03240', 'Xã Ba Xa'),
    ('08', '03241', 'Xã Vĩnh Thực'),
    ('12', '03242', 'Xã Trà Vân'),
    ('11', '03243', 'Xã Lượng Minh'),
    ('26', '03244', 'Xã Thu Lũm'),
    ('06', '03245', 'Xã Tiền Phong'),
    ('25', '03246', 'Xã Đức Long'),
    ('21', '03247', 'Xã Chà Tở'),
    ('23', '03248', 'Xã Đăk Long'),
    ('30', '03249', 'Xã Thạnh An'),
    ('11', '03250', 'Xã Huồi Tụ'),
    ('07', '03251', 'Xã Phú Xuân'),
    ('03', '03252', 'Xã Ba Lòng'),
    ('25', '03253', 'Xã Thành Công'),
    ('29', '03254', 'Xã Đông Giang'),
    ('11', '03255', 'Xã Keng Đu'),
    ('23', '03256', 'Xã Ia Đal'),
    ('34', '03257', 'Xã Tiên Nguyên'),
    ('07', '03258', 'Xã Sơn Điện'),
    ('14', '03259', 'Xã Cam Hiệp'),
    ('12', '03260', 'Xã Nam Giang'),
    ('25', '03261', 'Xã Bạch Đằng'),
    ('28', '03262', 'Xã Đăk Song'),
    ('25', '03263', 'Xã Ca Thành'),
    ('12', '03264', 'Xã Phước Thành'),
    ('11', '03265', 'Xã Bình Chuẩn'),
    ('19', '03266', 'Xã Vĩnh Thông'),
    ('12', '03267', 'Xã Bến Hiên'),
    ('34', '03268', 'Xã Lao Chải'),
    ('08', '03269', 'Xã Hải Sơn'),
    ('12', '03270', 'Xã Phước Hiệp'),
    ('07', '03271', 'Xã Tam chung'),
    ('25', '03272', 'Xã Canh Tân'),
    ('23', '03273', 'Xã Đặng Thùy Trâm'),
    ('12', '03274', 'Xã Phước Chánh'),
    ('25', '03275', 'Xã Minh Khai'),
    ('07', '03276', 'Xã Xuân Thái'),
    ('23', '03277', 'Xã Cà Đam'),
    ('11', '03278', 'Xã Na Loi'),
    ('31', '03279', 'Xã Mường Lèo'),
    ('09', '03280', 'Xã Bản Liền'),
    ('34', '03281', 'Xã Cao Bồ'),
    ('07', '03282', 'Xã Tam Thanh'),
    ('28', '03283', 'Xã Ia Púch'),
    ('07', '03284', 'Xã Na Mèo'),
    ('07', '03285', 'Xã Bát Mọt'),
    ('07', '03286', 'Xã Sơn Thủy'),
    ('07', '03287', 'Xã Mường Chanh'),
    ('19', '03288', 'Xã Quảng Bạch'),
    ('20', '03289', 'Xã Đoàn Kết'),
    ('04', '03290', 'Xã A Lưới 5'),
    ('19', '03291', 'Xã Thượng Quan'),
    ('03', '03292', 'Xã Thượng Trạch'),
    ('03', '03293', 'Xã Hướng Lập'),
    ('07', '03294', 'Xã Nhi Sơn'),
    ('28', '03295', 'Xã Ia Mơ'),
    ('26', '03296', 'Xã Mù Cả'),
    ('19', '03297', 'Xã Sảng Mộc'),
    ('07', '03298', 'Xã Trung Sơn'),
    ('12', '03299', 'Xã Đắc Pring'),
    ('20', '03300', 'Xã Quý Hòa'),
    ('07', '03301', 'Xã Mường Mìn'),
    ('11', '03302', 'Xã Hữu Khuông'),
    ('12', '03303', 'Xã La Dêê'),
    ('18', '03304', 'Xã Sơn Hải'),
    ('09', '03305', 'Xã Chế Tạo'),
    ('12', '03306', 'Xã Tân Hiệp'),
    ('18', '03307', 'Xã Hòn Nghệ'),
    ('12', '03308', 'Xã La Êê'),
    ('28', '03309', 'Xã Canh Liên'),
    ('28', '03310', 'Xã Nhơn Châu'),
    ('09', '03311', 'Xã Tà Xi Láng'),
    ('18', '03312', 'Đặc khu Thổ Châu'),
    ('18', '03313', 'Xã Tiên Hải'),
    ('28', '03314', 'Xã An Toàn'),
    ('09', '03315', 'Xã Nậm Xé'),
    ('08', '03316', 'Xã Cái Chiên'),
    ('05', '03317', 'Đặc khu Bạch Long Vĩ'),
    ('14', '03318', 'Đặc khu Trường Sa'),
    ('03', '03319', 'Đặc khu Cồn Cỏ'),
    ('12', '03320', 'Đặc khu Hoàng Sa')
) AS w(province_code, code, name)
JOIN provinces p ON p.code = w.province_code;


-- ###########################################################################
-- Synced from migration 20260531_025_company_recruitment.sql
-- ###########################################################################

-- =============================================================================
-- JOBLINK MIGRATION 20260531_025 — COMPANY RECRUITMENT COMPLETION
-- =============================================================================
-- Bổ sung các chức năng company còn thiếu so với SRS:
--   • FR-M05-005 / UC-14: Lịch phỏng vấn (interview_schedules) — recruiter tạo
--     lịch khi chuyển ứng viên sang 'interview'; ứng viên xác nhận / từ chối.
--   • UC-12: RPC get_my_applications — member theo dõi trạng thái đơn + timeline
--     history + lịch phỏng vấn (cần cho luồng xác nhận lịch).
--   • FR-M02-007 / UC-06: resubmit_company_verification — company gửi lại hồ sơ
--     khi bị reject / pending_update (→ pending).
--   • FR-M05-001 / UC-09: expire_due_jobs() + hiển thị status 'expired' hiệu lực
--     theo expires_at trong dashboard (không phụ thuộc cron).
--   • FR-M07-004: job_view_logs + log_job_view() + đếm lượt xem job vào dashboard.
--
-- Quy ước: tất cả RPC SECURITY INVOKER, tự resolve user qua auth.uid() và check
-- quyền sở hữu; trả jsonb union {ok,...}. RLS KHÔNG bật trên bảng recruitment
-- (giống job_applications/application_status_history) nên INVOKER ghi được.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. interview_schedules: thêm trạng thái phản hồi của ứng viên
-- -----------------------------------------------------------------------------
ALTER TABLE public.interview_schedules
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'declined')),
    ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_interview_schedules_application
    ON public.interview_schedules(application_id, scheduled_at DESC);

-- RPC ghi bằng SECURITY INVOKER → cấp quyền DML cho authenticated (RLS không bật
-- trên bảng recruitment, khớp với job_applications/application_status_history).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_schedules TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.interview_schedules_id_seq TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. job_view_logs: nhật ký lượt xem job (FR-M07-004)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_view_logs (
    id             BIGSERIAL PRIMARY KEY,
    job_id         BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    viewer_user_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    viewed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_view_logs_job
    ON public.job_view_logs(job_id, viewed_at DESC);

GRANT SELECT, INSERT ON public.job_view_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.job_view_logs_id_seq TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. RPC: log_job_view — đếm lượt xem (dedupe theo viewer+job trong 6 giờ;
--    bỏ qua khi viewer chính là chủ job để không tự bơm số liệu).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_job_view(p_job_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_owner BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    SELECT company_user_id INTO v_owner
      FROM public.jobs
     WHERE id = p_job_id AND deleted_at IS NULL LIMIT 1;

    IF v_owner IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'jobNotFound');
    END IF;

    -- Không log khi chủ job tự xem.
    IF v_me IS NOT NULL AND v_me = v_owner THEN
        RETURN jsonb_build_object('ok', TRUE, 'logged', FALSE);
    END IF;

    -- Dedupe: cùng viewer + job trong 6 giờ → bỏ qua.
    IF v_me IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.job_view_logs
         WHERE job_id = p_job_id
           AND viewer_user_id = v_me
           AND viewed_at > NOW() - INTERVAL '6 hours'
    ) THEN
        RETURN jsonb_build_object('ok', TRUE, 'logged', FALSE);
    END IF;

    INSERT INTO public.job_view_logs(job_id, viewer_user_id)
    VALUES (p_job_id, v_me);

    RETURN jsonb_build_object('ok', TRUE, 'logged', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_job_view(BIGINT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 4. expire_due_jobs — chuyển active → expired khi quá expires_at.
--    SECURITY DEFINER để có thể chạy bởi cron/admin bất kỳ. Trả số job đã đổi.
--    Được gọi opportunistic ở đầu get_company_dashboard_overview (xem dưới).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_due_jobs()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
VOLATILE
AS $$
DECLARE
    v_count INT;
BEGIN
    WITH updated AS (
        UPDATE public.jobs
           SET status = 'expired', updated_at = NOW()
         WHERE status = 'active'
           AND deleted_at IS NULL
           AND expires_at IS NOT NULL
           AND expires_at <= NOW()
        RETURNING 1
    )
    SELECT COUNT(*)::INT INTO v_count FROM updated;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_due_jobs() TO authenticated;

-- Lên lịch chạy mỗi 15 phút nếu pg_cron khả dụng (an toàn nếu không có).
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'joblink-expire-jobs',
            '*/15 * * * *',
            'SELECT public.expire_due_jobs();'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Không chặn migration nếu schedule lỗi (vd extension thiếu quyền).
    NULL;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RPC: schedule_interview — recruiter tạo / dời lịch phỏng vấn.
--    Owner-only. Chuyển đơn sang 'interview' (ghi history) nếu chưa terminal.
--    Reschedule = xoá lịch cũ rồi tạo lịch mới (1 lịch hiệu lực / đơn).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.schedule_interview(
    p_application_id  BIGINT,
    p_scheduled_at    TIMESTAMPTZ,
    p_duration_minutes INT,
    p_location_or_link TEXT,
    p_note            TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_company_user_id BIGINT;
    v_old_status TEXT;
    v_applicant_id BIGINT;
    v_job_id BIGINT;
    v_job_title TEXT;
    v_duration INT;
    v_interview_id BIGINT;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    SELECT j.company_user_id, a.status, a.applicant_id, j.id, j.title
      INTO v_company_user_id, v_old_status, v_applicant_id, v_job_id, v_job_title
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
    IF v_old_status IN ('hired', 'rejected', 'withdrawn') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'cannotSchedule');
    END IF;
    IF p_scheduled_at IS NULL OR p_scheduled_at <= v_now THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidScheduleTime');
    END IF;

    v_duration := COALESCE(p_duration_minutes, 60);
    IF v_duration < 15 OR v_duration > 480 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'invalidDuration');
    END IF;

    -- Reschedule: xoá lịch cũ của đơn này.
    DELETE FROM public.interview_schedules WHERE application_id = p_application_id;

    INSERT INTO public.interview_schedules(
        application_id, scheduled_at, duration_minutes, location_or_link,
        note, created_by, status
    ) VALUES (
        p_application_id, p_scheduled_at, v_duration,
        NULLIF(btrim(COALESCE(p_location_or_link, '')), ''),
        NULLIF(btrim(COALESCE(p_note, '')), ''),
        v_me, 'scheduled'
    )
    RETURNING id INTO v_interview_id;

    -- Đồng bộ trạng thái đơn sang 'interview' (+history) nếu chưa.
    IF v_old_status <> 'interview' THEN
        UPDATE public.job_applications
           SET status = 'interview', updated_at = v_now
         WHERE id = p_application_id;

        INSERT INTO public.application_status_history(
            application_id, old_status, new_status, changed_by, note, changed_at
        ) VALUES (
            p_application_id, v_old_status, 'interview', v_me, NULL, v_now
        );
    END IF;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'interviewId', v_interview_id,
        'applicationId', p_application_id,
        'applicantId', v_applicant_id,
        'jobId', v_job_id,
        'jobTitle', v_job_title,
        'scheduledAt', p_scheduled_at,
        'statusChanged', v_old_status <> 'interview'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.schedule_interview(
    BIGINT, TIMESTAMPTZ, INT, TEXT, TEXT
) TO authenticated;

-- -----------------------------------------------------------------------------
-- 6. RPC: respond_interview — ứng viên xác nhận / từ chối lịch.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.respond_interview(
    p_interview_id BIGINT,
    p_accept BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_applicant_id BIGINT;
    v_company_user_id BIGINT;
    v_job_id BIGINT;
    v_job_title TEXT;
    v_application_id BIGINT;
    v_new_status TEXT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;

    SELECT a.applicant_id, j.company_user_id, j.id, j.title, a.id
      INTO v_applicant_id, v_company_user_id, v_job_id, v_job_title, v_application_id
      FROM public.interview_schedules s
      JOIN public.job_applications a ON a.id = s.application_id
      JOIN public.jobs j ON j.id = a.job_id
     WHERE s.id = p_interview_id
     LIMIT 1;

    IF v_applicant_id IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'interviewNotFound');
    END IF;
    IF v_applicant_id <> v_me THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notOwner');
    END IF;

    v_new_status := CASE WHEN p_accept THEN 'confirmed' ELSE 'declined' END;

    UPDATE public.interview_schedules
       SET status = v_new_status, responded_at = NOW(), updated_at = NOW()
     WHERE id = p_interview_id;

    RETURN jsonb_build_object(
        'ok', TRUE,
        'status', v_new_status,
        'companyUserId', v_company_user_id,
        'jobId', v_job_id,
        'jobTitle', v_job_title,
        'applicationId', v_application_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.respond_interview(BIGINT, BOOLEAN) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. RPC: get_my_applications — member theo dõi đơn (UC-12) + lịch phỏng vấn.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_applications(
    p_limit INT DEFAULT 30,
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

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 30), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);

    WITH base AS (
        SELECT a.id AS application_id, a.status, a.applied_at, a.updated_at,
               j.id AS job_id, j.title AS job_title, j.status AS job_status,
               j.company_user_id,
               COALESCE(cp.name, cu.email) AS company_name,
               cp.logo_url AS company_logo_url
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users cu ON cu.id = j.company_user_id
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = j.company_user_id AND cp.deleted_at IS NULL
         WHERE a.applicant_id = v_me
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT * FROM base ORDER BY updated_at DESC LIMIT v_lim OFFSET v_off
    )
    SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
            'applicationId', p.application_id,
            'status', p.status,
            'appliedAt', p.applied_at,
            'updatedAt', p.updated_at,
            'jobId', p.job_id,
            'jobTitle', p.job_title,
            'jobStatus', p.job_status,
            'companyUserId', p.company_user_id,
            'companyName', p.company_name,
            'companyLogoUrl', p.company_logo_url,
            'interview', (
                SELECT jsonb_build_object(
                    'id', s.id,
                    'scheduledAt', s.scheduled_at,
                    'durationMinutes', s.duration_minutes,
                    'locationOrLink', s.location_or_link,
                    'note', s.note,
                    'status', s.status
                )
                FROM public.interview_schedules s
                WHERE s.application_id = p.application_id
                ORDER BY s.scheduled_at DESC
                LIMIT 1
            ),
            'history', (
                SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    'oldStatus', h.old_status,
                    'newStatus', h.new_status,
                    'changedAt', h.changed_at,
                    'note', h.note
                ) ORDER BY h.changed_at), '[]'::jsonb)
                FROM public.application_status_history h
                WHERE h.application_id = p.application_id
            )
        ) ORDER BY p.updated_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_applications(INT, INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC: resubmit_company_verification — company gửi lại hồ sơ (FR-M02-007).
--    Cho phép khi đang ở 'rejected' / 'pending_update' → chuyển về 'pending'.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resubmit_company_verification()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_status TEXT;
BEGIN
    SELECT u.id, u.role INTO v_me, v_role FROM public.users u
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'unauthorized');
    END IF;
    IF v_role <> 'company' THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notCompany');
    END IF;

    SELECT verification_status INTO v_status
      FROM public.company_profiles
     WHERE user_id = v_me AND deleted_at IS NULL LIMIT 1;

    IF v_status IS NULL THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'companyNotFound');
    END IF;
    IF v_status NOT IN ('rejected', 'pending_update') THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'notResubmittable');
    END IF;

    UPDATE public.company_profiles
       SET verification_status = 'pending',
           verification_note = NULL,
           verified_by = NULL,
           verified_at = NULL,
           updated_at = NOW()
     WHERE user_id = v_me;

    RETURN jsonb_build_object('ok', TRUE, 'status', 'pending');
END;
$$;

GRANT EXECUTE ON FUNCTION public.resubmit_company_verification() TO authenticated;

-- =============================================================================
-- 9. CẬP NHẬT get_company_dashboard_overview
--    + opportunistic expire_due_jobs()
--    + stat jobViews (tổng lượt xem job của công ty)
--    + recentJobs.viewCount + effective status 'expired'
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_company_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
VOLATILE
AS $$
DECLARE
    v_me BIGINT;
    v_role TEXT;
    v_active_jobs INT;
    v_total_apps INT;
    v_apps_this_month INT;
    v_hires_total INT;
    v_job_views INT;
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

    -- Tự chuyển job quá hạn (best-effort; không cần cron).
    PERFORM public.expire_due_jobs();

    SELECT COUNT(*)::INT INTO v_active_jobs
      FROM public.jobs j
     WHERE j.company_user_id = v_me AND j.status = 'active' AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT INTO v_total_apps
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;

    SELECT COUNT(*)::INT INTO v_apps_this_month
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
       AND a.applied_at >= date_trunc('month', NOW());

    SELECT COUNT(*)::INT INTO v_hires_total
      FROM public.job_applications a
      JOIN public.jobs j ON j.id = a.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL AND a.status = 'hired';

    SELECT COUNT(*)::INT INTO v_job_views
      FROM public.job_view_logs v
      JOIN public.jobs j ON j.id = v.job_id
     WHERE j.company_user_id = v_me AND j.deleted_at IS NULL;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', x.id,
            'title', x.title,
            'status', x.status,
            'createdAt', x.created_at,
            'expiresAt', x.expires_at,
            'applicantCount', x.applicant_count,
            'viewCount', x.view_count
        ) ORDER BY x.created_at DESC
    ), '[]'::jsonb)
    INTO v_recent_jobs
    FROM (
        SELECT j.id, j.title,
               CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                         AND j.expires_at <= NOW()
                    THEN 'expired' ELSE j.status END AS status,
               j.created_at, j.expires_at,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_applications a
                          WHERE a.job_id = j.id), 0) AS applicant_count,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_view_logs v
                          WHERE v.job_id = j.id), 0) AS view_count
          FROM public.jobs j
         WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
         ORDER BY j.created_at DESC
         LIMIT 5
    ) x;

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
        SELECT a.id AS application_id, a.applicant_id,
               COALESCE(mp.full_name, cp.name, u.email) AS display_name,
               COALESCE(mp.avatar_url, cp.logo_url) AS avatar_url,
               COALESCE(mp.headline, cp.industry) AS headline,
               j.id AS job_id, j.title AS job_title, a.status, a.applied_at
          FROM public.job_applications a
          JOIN public.jobs j ON j.id = a.job_id
          JOIN public.users u ON u.id = a.applicant_id
          LEFT JOIN public.member_profiles mp
            ON mp.user_id = a.applicant_id AND mp.deleted_at IS NULL
          LEFT JOIN public.company_profiles cp
            ON cp.user_id = a.applicant_id AND cp.deleted_at IS NULL
         WHERE j.company_user_id = v_me AND j.deleted_at IS NULL
         ORDER BY a.applied_at DESC
         LIMIT 5
    ) x;

    RETURN jsonb_build_object(
        'stats', jsonb_build_object(
            'activeJobs', v_active_jobs,
            'totalApplications', v_total_apps,
            'applicationsThisMonth', v_apps_this_month,
            'jobViews', v_job_views,
            'hireRate', CASE
                WHEN v_total_apps > 0
                THEN ROUND((v_hires_total::NUMERIC / v_total_apps) * 100, 1)
                ELSE 0 END
        ),
        'recentJobs', v_recent_jobs,
        'recentApplicants', v_recent_apps
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_dashboard_overview() TO authenticated;

-- =============================================================================
-- 10. CẬP NHẬT get_company_jobs — thêm viewCount + effective status 'expired'
-- =============================================================================
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
     WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;

    IF v_me IS NULL OR v_role <> 'company' THEN
        RETURN jsonb_build_object('items', '[]'::jsonb, 'total', 0);
    END IF;

    v_lim := GREATEST(LEAST(COALESCE(p_limit, 20), 100), 1);
    v_off := GREATEST(COALESCE(p_offset, 0), 0);
    v_q := NULLIF(btrim(COALESCE(p_search, '')), '');

    WITH base AS (
        SELECT j.*,
               CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                         AND j.expires_at <= NOW()
                    THEN 'expired' ELSE j.status END AS effective_status
          FROM public.jobs j
         WHERE j.company_user_id = v_me
           AND j.deleted_at IS NULL
           AND (p_status = 'all' OR
                (CASE WHEN j.status = 'active' AND j.expires_at IS NOT NULL
                           AND j.expires_at <= NOW()
                      THEN 'expired' ELSE j.status END) = p_status)
           AND (v_q IS NULL OR j.title ILIKE '%' || v_q || '%')
    ),
    counted AS (SELECT COUNT(*)::INT AS total FROM base),
    page AS (
        SELECT b.id, b.title, b.effective_status AS status, b.created_at, b.expires_at,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_applications a
                          WHERE a.job_id = b.id), 0) AS applicant_count,
               COALESCE((SELECT COUNT(*)::INT FROM public.job_view_logs v
                          WHERE v.job_id = b.id), 0) AS view_count
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
            'applicantCount', p.applicant_count,
            'viewCount', p.view_count
        ) ORDER BY p.created_at DESC), '[]'::jsonb),
        (SELECT total FROM counted)
      INTO v_items, v_total
      FROM page p;

    RETURN jsonb_build_object('items', v_items, 'total', COALESCE(v_total, 0));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_company_jobs(TEXT, TEXT, INT, INT) TO authenticated;

-- =============================================================================
-- END MIGRATION 20260531_025
-- =============================================================================

-- =============================================================================
-- 25. PROFILE DETAIL / EDIT RPCs + UPDATE JOB
-- Synced from migrations 20260528_022, 20260528_027, 20260601_027,
--   20260601_028 và 20260601_031 (member skills free-text per user).
--   • get_profile_detail / get_profile_edit_overview: bản cuối (031) đọc
--     member_skills.name trực tiếp, không JOIN bảng danh mục `skills`.
--   • update_job: bản cuối (028) dùng tham số p_ward_id + position_title.
-- =============================================================================

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

GRANT EXECUTE ON FUNCTION public.get_profile_detail(BIGINT) TO authenticated;

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

GRANT EXECUTE ON FUNCTION public.get_profile_edit_overview() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_job(
    p_job_id BIGINT,
    p_title TEXT,
    p_description TEXT,
    p_requirements TEXT,
    p_province_id BIGINT,
    p_ward_id BIGINT,
    p_salary_min BIGINT,
    p_salary_max BIGINT,
    p_salary_visible BOOLEAN,
    p_job_type_id BIGINT,
    p_work_mode_id BIGINT,
    p_position_title TEXT,
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
    v_company_user_id BIGINT;
    v_old_status TEXT;
    v_skill_name TEXT;
    v_skill_id BIGINT;
    v_position_title TEXT;
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

    v_position_title := NULLIF(btrim(COALESCE(p_position_title, '')), '');
    IF v_position_title IS NOT NULL AND char_length(v_position_title) > 255 THEN
        RETURN jsonb_build_object('ok', FALSE, 'error', 'positionTitleTooLong');
    END IF;

    UPDATE public.jobs
       SET title = btrim(p_title),
           description = btrim(p_description),
           requirements = NULLIF(btrim(COALESCE(p_requirements, '')), ''),
           province_id = p_province_id,
           ward_id = p_ward_id,
           salary_min = p_salary_min,
           salary_max = p_salary_max,
           salary_visible = COALESCE(p_salary_visible, TRUE),
           job_type_id = p_job_type_id,
           work_mode_id = p_work_mode_id,
           position_title = v_position_title,
           expires_at = p_expires_at,
           updated_at = NOW()
     WHERE id = p_job_id;

    -- Thay toàn bộ skills: xoá hết rồi chèn lại theo danh sách mới.
    DELETE FROM public.job_skills WHERE job_id = p_job_id;

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
            VALUES (p_job_id, v_skill_id, TRUE)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    RETURN jsonb_build_object('ok', TRUE, 'jobId', p_job_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job(
    BIGINT, TEXT, TEXT, TEXT, BIGINT, BIGINT, BIGINT, BIGINT, BOOLEAN,
    BIGINT, BIGINT, TEXT, TIMESTAMPTZ, TEXT[]
) TO authenticated;

-- =============================================================================
-- END SYNC (migrations through 20260601_031)
-- =============================================================================


-- =================================================================================
-- BỔ SUNG KIẾN TRÚC O(1) VÀO SCHEMA (TỪ MIGRATION 042)
-- =================================================================================
-- =================================================================================
-- MIGRATION: Kiến trúc O(1) cho Joblink (Denormalization & Push Model Feed)
-- Đồng bộ chính xác với Type của Next.js Frontend
-- =================================================================================

-- 1. POSTS DENORMALIZATION (Counter Caches)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reaction_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS share_count INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_posts_counts ON public.posts(reaction_count DESC, comment_count DESC);

-- Trigger Reactions
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

DROP TRIGGER IF EXISTS trg_post_reaction_counter ON public.post_reactions;
CREATE TRIGGER trg_post_reaction_counter AFTER INSERT OR DELETE ON public.post_reactions FOR EACH ROW EXECUTE FUNCTION public.post_reaction_counter_trigger();

-- Trigger Comments
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

DROP TRIGGER IF EXISTS trg_post_comment_counter ON public.post_comments;
CREATE TRIGGER trg_post_comment_counter AFTER INSERT OR UPDATE OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.post_comment_counter_trigger();

-- Trigger Shares
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

DROP TRIGGER IF EXISTS trg_post_share_counter ON public.post_shares;
CREATE TRIGGER trg_post_share_counter AFTER INSERT OR DELETE ON public.post_shares FOR EACH ROW EXECUTE FUNCTION public.post_share_counter_trigger();


-- 2. MESSAGING DENORMALIZATION (Inbox O(1))
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_id BIGINT REFERENCES public.messages(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_content TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_sender_id BIGINT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_created_at TIMESTAMPTZ;
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;

CREATE OR REPLACE FUNCTION public.joblink_after_message_insert() RETURNS trigger AS $$
BEGIN
    UPDATE public.conversations
       SET updated_at = NEW.created_at, last_message_id = NEW.id, last_content = NEW.content, last_sender_id = NEW.sender_id, last_message_created_at = NEW.created_at
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

DROP TRIGGER IF EXISTS trg_reset_unread_count ON public.conversation_participants;
CREATE TRIGGER trg_reset_unread_count BEFORE UPDATE ON public.conversation_participants FOR EACH ROW EXECUTE FUNCTION public.reset_unread_count_trigger();


-- 3. CONNECTIONS: GIẢI QUYẾT OR BẰNG VIEW
CREATE OR REPLACE VIEW public.user_connections_view AS
SELECT requester_id AS from_user_id, receiver_id AS to_user_id, status, COALESCE(responded_at, requested_at) AS connected_at FROM public.connections
UNION ALL
SELECT receiver_id AS from_user_id, requester_id AS to_user_id, status, COALESCE(responded_at, requested_at) AS connected_at FROM public.connections;

-- Precomputed Suggestions
CREATE TABLE IF NOT EXISTS public.network_suggestions (
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    suggested_user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, suggested_user_id)
);

-- Hàm sinh suggestions ngẫu nhiên nhanh (thay thế ORDER BY RANDOM quét toàn bảng)
CREATE OR REPLACE FUNCTION public.generate_quick_suggestions(p_user_id BIGINT, p_limit INT) RETURNS void AS $$
BEGIN
    DELETE FROM public.network_suggestions WHERE user_id = p_user_id;
    INSERT INTO public.network_suggestions (user_id, suggested_user_id, score)
    SELECT p_user_id, u.id, 1
      FROM public.users u
     WHERE u.deleted_at IS NULL AND u.status = 'active' AND u.role <> 'admin' AND u.id <> p_user_id
       AND u.id NOT IN (SELECT to_user_id FROM public.user_connections_view WHERE from_user_id = p_user_id)
     ORDER BY u.id DESC LIMIT p_limit * 5; -- Lấy 1 tập nhỏ mới nhất để random in-memory ở RPC
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. HOME FEED: PUSH MODEL (Fan-out)
CREATE TABLE IF NOT EXISTS public.user_feeds (
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_user_feeds_user_created ON public.user_feeds(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.fanout_post_to_feed() RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'active' AND NEW.deleted_at IS NULL THEN
        INSERT INTO public.user_feeds (user_id, post_id, created_at) VALUES (NEW.author_id, NEW.id, NEW.created_at) ON CONFLICT DO NOTHING;
        IF NEW.visibility IN ('public', 'connections') THEN
            INSERT INTO public.user_feeds (user_id, post_id, created_at)
            SELECT to_user_id, NEW.id, NEW.created_at FROM public.user_connections_view WHERE from_user_id = NEW.author_id AND status = 'accepted' ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fanout_post ON public.posts;
CREATE TRIGGER trg_fanout_post AFTER INSERT OR UPDATE OF status, visibility, deleted_at ON public.posts FOR EACH ROW EXECUTE FUNCTION public.fanout_post_to_feed();


-- 5. REWRITE CÁC RPC ĐỂ ĐẢM BẢO ĐÚNG ARCHITECTURE VÀ TYPE CỦA NEXT.JS

-- 5A. get_messaging_overview
CREATE OR REPLACE FUNCTION public.get_messaging_overview(p_limit INT DEFAULT 50) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER STABLE AS $$
DECLARE
    v_me BIGINT;
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('items', '[]'::jsonb, 'unreadConversations', 0); END IF;

    RETURN (
        WITH my_convo AS (SELECT cp.conversation_id, cp.unread_count FROM public.conversation_participants cp WHERE cp.user_id = v_me),
        overview AS (
            SELECT c.id AS "conversationId", c.updated_at AS "updatedAt", c.last_message_id AS "lastMessageId", c.last_sender_id AS "lastSenderId", c.last_content AS "lastContent", c.last_message_created_at AS "lastCreatedAt", mc.unread_count AS "unreadCount", op.user_id AS "otherUserId", COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline", u.role AS "role"
            FROM my_convo mc
            JOIN public.conversations c ON c.id = mc.conversation_id
            JOIN public.conversation_participants op ON op.conversation_id = c.id AND op.user_id <> v_me
            JOIN public.users u ON u.id = op.user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = op.user_id AND mp.deleted_at IS NULL
            LEFT JOIN public.company_profiles cp ON cp.user_id = op.user_id AND cp.deleted_at IS NULL
            ORDER BY c.updated_at DESC LIMIT p_limit
        )
        SELECT jsonb_build_object('items', COALESCE(jsonb_agg(row_to_jsonb(o)), '[]'::jsonb), 'unreadConversations', (SELECT COUNT(*) FROM my_convo WHERE unread_count > 0)) FROM overview o
    );
END;
$$;


-- 5B. get_network_overview
CREATE OR REPLACE FUNCTION public.get_network_overview(p_suggestion_limit INT DEFAULT 24) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_me BIGINT;
    v_suggestions JSONB; v_connections JSONB; v_incoming JSONB; v_outgoing JSONB;
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN RETURN jsonb_build_object('suggestions', '[]'::jsonb, 'connections', '[]'::jsonb, 'incoming', '[]'::jsonb, 'outgoing', '[]'::jsonb); END IF;

    -- Ensure precomputed suggestions exist
    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (SELECT c.suggested_user_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.network_suggestions c
            JOIN public.users u ON u.id = c.suggested_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.user_id = v_me ORDER BY RANDOM() LIMIT p_suggestion_limit) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_connections
      FROM (SELECT ac.to_user_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.user_connections_view ac JOIN public.users u ON u.id = ac.to_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = ac.to_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = ac.to_user_id
            WHERE ac.from_user_id = v_me AND ac.status = 'accepted' LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_incoming
      FROM (SELECT c.requester_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.connections c JOIN public.users u ON u.id = c.requester_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.receiver_id = v_me AND c.status = 'pending' ORDER BY c.requested_at DESC LIMIT 50) s;

    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_outgoing
      FROM (SELECT c.receiver_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.connections c JOIN public.users u ON u.id = c.receiver_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.requester_id = v_me AND c.status = 'pending' ORDER BY c.requested_at DESC LIMIT 50) s;

    RETURN jsonb_build_object('suggestions', v_suggestions, 'connections', v_connections, 'incoming', v_incoming, 'outgoing', v_outgoing);
END;
$$;


-- 5C. get_home_feed (Full Next.js Type Match)
CREATE OR REPLACE FUNCTION public.get_home_feed(p_posts_cursor TIMESTAMPTZ DEFAULT NULL, p_posts_limit INT DEFAULT 20, p_suggestion_limit INT DEFAULT 12) RETURNS JSONB LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
    v_me BIGINT; v_stats JSONB; v_posts JSONB; v_jobs JSONB; v_suggestions JSONB; v_suggested_jobs JSONB; v_connection_ids BIGINT[];
BEGIN
    SELECT u.id INTO v_me FROM public.users u WHERE u.auth_id = auth.uid() AND u.deleted_at IS NULL LIMIT 1;
    IF v_me IS NULL THEN
        RETURN jsonb_build_object('stats', jsonb_build_object('connection_count', 0, 'profile_view_count', 0), 'suggestions', '[]'::jsonb, 'suggested_jobs', '[]'::jsonb, 'posts', '[]'::jsonb, 'jobs', '[]'::jsonb, 'connection_ids', '[]'::jsonb, 'me', NULL, 'next_cursor', NULL);
    END IF;

    SELECT jsonb_build_object('connection_count', u.connection_count, 'profile_view_count', u.profile_view_count) INTO v_stats FROM public.users u WHERE u.id = v_me;
    SELECT COALESCE(array_agg(to_user_id), '{}') INTO v_connection_ids FROM public.user_connections_view WHERE from_user_id = v_me AND status = 'accepted';

    -- Suggestions
    PERFORM public.generate_quick_suggestions(v_me, p_suggestion_limit);
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggestions
      FROM (SELECT c.suggested_user_id AS "userId", u.role, COALESCE(mp.full_name, cp.name) AS "displayName", COALESCE(mp.avatar_url, cp.logo_url) AS "avatarUrl", COALESCE(mp.headline, cp.industry) AS "headline"
            FROM public.network_suggestions c JOIN public.users u ON u.id = c.suggested_user_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = u.id LEFT JOIN public.company_profiles cp ON cp.user_id = u.id
            WHERE c.user_id = v_me ORDER BY RANDOM() LIMIT p_suggestion_limit) s;

    -- Suggested Jobs
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_suggested_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId", COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl", cp.verification_status = 'verified' AS "companyVerified", pv.name AS "provinceName", w.name AS "wardName", jt.name AS "jobTypeName", wm.name AS "workModeName", j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.salary_visible AS "salaryVisible", j.created_at AS "createdAt", false AS "viewerSaved", false AS "viewerApplied"
            FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
            LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards w ON w.id = j.ward_id LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
            WHERE j.status = 'active' AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW()) ORDER BY j.created_at DESC LIMIT 5) s;

    -- Posts (Push Model O(1))
    WITH feed_ids AS (
        SELECT post_id, created_at FROM public.user_feeds WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor) ORDER BY created_at DESC LIMIT p_posts_limit
    )
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_posts
      FROM (SELECT p.id, p.author_id AS "authorId", p.content, p.post_type AS "postType", p.media, p.visibility, p.created_at AS "createdAt",
                 jsonb_build_object('userId', p.author_id, 'role', u.role, 'displayName', COALESCE(mp.full_name, cp.name), 'avatarUrl', COALESCE(mp.avatar_url, cp.logo_url), 'headline', COALESCE(mp.headline, cp.industry)) AS author,
                 p.reaction_count AS "reactionCount", p.comment_count AS "commentCount", p.share_count AS "shareCount",
                 EXISTS(SELECT 1 FROM public.post_reactions pr WHERE pr.post_id = p.id AND pr.user_id = v_me) AS "viewerReacted"
            FROM feed_ids f JOIN public.posts p ON p.id = f.post_id JOIN public.users u ON u.id = p.author_id
            LEFT JOIN public.member_profiles mp ON mp.user_id = p.author_id LEFT JOIN public.company_profiles cp ON cp.user_id = p.author_id
            ORDER BY f.created_at DESC) s;

    -- Jobs Stream
    SELECT COALESCE(jsonb_agg(row_to_jsonb(s)), '[]'::jsonb) INTO v_jobs
      FROM (SELECT j.id, j.title, j.company_user_id AS "companyUserId", COALESCE(cp.name, u.email) AS "companyName", cp.logo_url AS "companyLogoUrl", cp.verification_status = 'verified' AS "companyVerified", pv.name AS "provinceName", w.name AS "wardName", jt.name AS "jobTypeName", wm.name AS "workModeName", j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.salary_visible AS "salaryVisible", j.created_at AS "createdAt", false AS "viewerSaved", false AS "viewerApplied"
            FROM public.jobs j JOIN public.users u ON u.id = j.company_user_id LEFT JOIN public.company_profiles cp ON cp.user_id = j.company_user_id
            LEFT JOIN public.provinces pv ON pv.id = j.province_id LEFT JOIN public.wards w ON w.id = j.ward_id LEFT JOIN public.job_types jt ON jt.id = j.job_type_id LEFT JOIN public.work_modes wm ON wm.id = j.work_mode_id
            WHERE j.status = 'active' AND j.deleted_at IS NULL AND (j.expires_at IS NULL OR j.expires_at > NOW()) AND (p_posts_cursor IS NULL OR j.created_at < p_posts_cursor) ORDER BY j.created_at DESC LIMIT p_posts_limit) s;

    RETURN jsonb_build_object(
        'stats', v_stats, 'suggestions', v_suggestions, 'suggested_jobs', v_suggested_jobs, 'posts', v_posts, 'jobs', v_jobs, 'connection_ids', to_jsonb(v_connection_ids), 'me', v_me, 'next_cursor', (SELECT MIN(created_at) FROM public.user_feeds WHERE user_id = v_me AND (p_posts_cursor IS NULL OR created_at < p_posts_cursor) LIMIT p_posts_limit)
    );
END;
$$;
