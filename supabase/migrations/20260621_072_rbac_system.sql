-- =============================================================================
-- RBAC System — Role-Based Access Control
-- Migration 072: roles, modules, actions, permissions, role_permissions
-- FULLY IDEMPOTENT — safe to re-run at any time
-- =============================================================================

-- =============================================================================
-- 1. TABLES (CREATE IF NOT EXISTS)
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

-- =============================================================================
-- 2. INDEXES (O(1) lookup)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_roles_deleted    ON public.roles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_roles_name       ON public.roles(name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rp_role          ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rp_permission    ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permissions_mod  ON public.permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON public.permissions(name);

-- =============================================================================
-- 3. SEED: MODULES (upsert)
-- =============================================================================

INSERT INTO public.modules (name, label, sort_order) VALUES
    ('dashboard',    'Bảng điều khiển',      1),
    ('users',        'Quản lý người dùng',   2),
    ('companies',    'Quản lý công ty',      3),
    ('jobs',         'Quản lý việc làm',      4),
    ('posts',        'Quản lý bài viết',      5),
    ('reports',      'Quản lý báo cáo',       6),
    ('appeals',      'Quản lý kháng nghị',   7),
    ('audit',        'Nhật ký hoạt động',     8),
    ('contacts',     'Liên hệ hỗ trợ',       9),
    ('brand',        'Thương hiệu',          10),
    ('report_types', 'Loại báo cáo',         11),
    ('lookups',      'Danh mục',             12),
    ('settings',     'Cài đặt hệ thống',     13),
    ('roles',        'Quản lý quyền',        14)
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label, sort_order = EXCLUDED.sort_order;

-- =============================================================================
-- 4. SEED: ACTIONS (upsert)
-- =============================================================================

INSERT INTO public.actions (name, label) VALUES
    ('view',        'Xem'),
    ('create',      'Tạo mới'),
    ('edit',        'Chỉnh sửa'),
    ('delete',      'Xóa'),
    ('export',      'Xuất dữ liệu'),
    ('suspend',     'Khóa tài khoản'),
    ('ban',         'Cấm'),
    ('restore',     'Khôi phục'),
    ('moderate',    'Duyệt / Kiểm duyệt'),
    ('status',      'Đổi trạng thái'),
    ('reply',       'Trả lời'),
    ('maintenance', 'Bật/tắt bảo trì')
ON CONFLICT (name) DO UPDATE SET label = EXCLUDED.label;

-- =============================================================================
-- 5. SEED: PERMISSIONS (module × action, upsert)
-- =============================================================================

-- Dashboard
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'dashboard.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'dashboard' AND a.name = 'view'
ON CONFLICT (name) DO NOTHING;

-- Users
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'users.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'users' AND a.name IN ('view', 'create', 'edit', 'delete', 'export', 'suspend', 'ban', 'restore')
ON CONFLICT (name) DO NOTHING;

-- Companies
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'companies.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'companies' AND a.name IN ('view', 'edit', 'suspend', 'moderate', 'restore')
ON CONFLICT (name) DO NOTHING;

-- Jobs
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'jobs.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'jobs' AND a.name IN ('view', 'moderate', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Posts
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'posts.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'posts' AND a.name IN ('view', 'moderate', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Reports
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'reports.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'reports' AND a.name IN ('view', 'moderate', 'status')
ON CONFLICT (name) DO NOTHING;

-- Appeals
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'appeals.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'appeals' AND a.name IN ('view', 'moderate')
ON CONFLICT (name) DO NOTHING;

-- Audit
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'audit.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'audit' AND a.name = 'view'
ON CONFLICT (name) DO NOTHING;

-- Contacts
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'contacts.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'contacts' AND a.name IN ('view', 'reply')
ON CONFLICT (name) DO NOTHING;

-- Brand
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'brand.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'brand' AND a.name IN ('view', 'edit')
ON CONFLICT (name) DO NOTHING;

-- Report Types
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'report_types.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'report_types' AND a.name IN ('view', 'create', 'edit', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Lookups
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'lookups.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'lookups' AND a.name IN ('view', 'create', 'edit', 'delete')
ON CONFLICT (name) DO NOTHING;

-- Settings
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'settings.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'settings' AND a.name IN ('view', 'edit', 'maintenance')
ON CONFLICT (name) DO NOTHING;

-- Roles
INSERT INTO public.permissions (module_id, action_id, name, label)
SELECT m.id, a.id, 'roles.' || a.name, m.label || ' - ' || a.label
FROM public.modules m, public.actions a
WHERE m.name = 'roles' AND a.name IN ('view', 'create', 'edit', 'delete')
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 6. SEED: SYSTEM ROLES (upsert)
-- =============================================================================

INSERT INTO public.roles (name, description, is_system) VALUES
    ('admin',   'Quản trị viên toàn quyền', TRUE),
    ('member',  'Thành viên thường',         TRUE),
    ('company', 'Nhà tuyển dụng',            TRUE)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 7. SEED: CUSTOM ROLES (upsert)
-- =============================================================================

INSERT INTO public.roles (name, description, is_system) VALUES
    ('content_moderator', 'Người duyệt nội dung', FALSE),
    ('user_manager',      'Quản lý người dùng',   FALSE),
    ('support_agent',     'Hỗ trợ khách hàng',    FALSE)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 8. SEED: ROLE_PERMISSIONS (admin = all, delete-then-insert per role)
-- =============================================================================

-- Admin: ALL permissions
DELETE FROM public.role_permissions WHERE role_id = (SELECT id FROM public.roles WHERE name = 'admin');
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Member: no admin-panel permissions by default.
DELETE FROM public.role_permissions WHERE role_id = (SELECT id FROM public.roles WHERE name = 'member');

-- Company: no admin-panel permissions by default.
DELETE FROM public.role_permissions WHERE role_id = (SELECT id FROM public.roles WHERE name = 'company');

-- Content Moderator: posts, reports, appeals, audit
DELETE FROM public.role_permissions WHERE role_id = (SELECT id FROM public.roles WHERE name = 'content_moderator');
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'content_moderator'
  AND (p.name = 'dashboard.view' OR p.name LIKE 'posts.%' OR p.name LIKE 'reports.%' OR p.name LIKE 'appeals.%' OR p.name LIKE 'audit.%')
ON CONFLICT DO NOTHING;

-- User Manager: users, companies, audit
DELETE FROM public.role_permissions WHERE role_id = (SELECT id FROM public.roles WHERE name = 'user_manager');
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'user_manager'
  AND (p.name = 'dashboard.view' OR p.name LIKE 'users.%' OR p.name LIKE 'companies.%' OR p.name LIKE 'audit.%')
ON CONFLICT DO NOTHING;

-- Support Agent: contacts, reports.view, audit.view
DELETE FROM public.role_permissions WHERE role_id = (SELECT id FROM public.roles WHERE name = 'support_agent');
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'support_agent'
  AND (p.name = 'dashboard.view' OR p.name LIKE 'contacts.%' OR p.name = 'reports.view' OR p.name = 'audit.view')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 9. ADD COLUMN role_id TO users TABLE (if not exists)
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role_id INT NULL REFERENCES public.roles(id);
    END IF;
END $$;

-- Sync role_id from legacy role column
UPDATE public.users u
SET role_id = r.id
FROM public.roles r
WHERE u.role = r.name AND u.role_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users(role_id) WHERE deleted_at IS NULL;

-- Admin remains full access even when future permissions are added.
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
       AND (u.role = 'admin' OR r.name = 'admin')
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
       AND (u.role = 'admin' OR r.name = 'admin')
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
     AND (u.role = 'admin' OR r.name = 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(BIGINT) TO anon, authenticated;

-- =============================================================================
-- 10. RLS POLICIES (drop + recreate = idempotent)
-- =============================================================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_admin_all" ON public.roles;
DROP POLICY IF EXISTS "modules_authenticated_read" ON public.modules;
DROP POLICY IF EXISTS "actions_authenticated_read" ON public.actions;
DROP POLICY IF EXISTS "permissions_authenticated_read" ON public.permissions;
DROP POLICY IF EXISTS "role_permissions_admin_all" ON public.role_permissions;

CREATE POLICY "roles_admin_all" ON public.roles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "modules_authenticated_read" ON public.modules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "actions_authenticated_read" ON public.actions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "permissions_authenticated_read" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_admin_all" ON public.role_permissions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =============================================================================
-- 11. GRANTS (idempotent — REVOKE + GRANT)
-- =============================================================================

-- Revoke all from authenticated only (keep service_role intact via Supabase defaults)
REVOKE ALL ON public.roles FROM authenticated;
REVOKE ALL ON public.modules FROM authenticated;
REVOKE ALL ON public.actions FROM authenticated;
REVOKE ALL ON public.permissions FROM authenticated;
REVOKE ALL ON public.role_permissions FROM authenticated;

GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.modules TO authenticated;
GRANT SELECT ON public.actions TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT ON public.role_permissions TO authenticated;

-- Service role gets full access (Supabase default via postgres role)
GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.actions TO service_role;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.role_permissions TO service_role;

-- =============================================================================
-- END RBAC MIGRATION
-- =============================================================================
