-- =============================================================================
-- Dynamic RBAC unification
-- - `role_id` is the authorization source of truth.
-- - `account_type` is the business/profile type used by member/company flows.
-- - `admin`, `member`, `company` are seeded RBAC roles with permissions.
-- =============================================================================

-- 1) Keep the business profile type separate from RBAC role assignment.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_type VARCHAR(20);

UPDATE public.users
   SET account_type = COALESCE(account_type, role, 'member')
 WHERE account_type IS NULL;

ALTER TABLE public.users
  ALTER COLUMN account_type SET DEFAULT 'member',
  ALTER COLUMN account_type SET NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_account_type;
ALTER TABLE public.users
  ADD CONSTRAINT chk_users_account_type
  CHECK (account_type IN ('member', 'company', 'admin'));

CREATE INDEX IF NOT EXISTS idx_users_account_type
  ON public.users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_account_type_status
  ON public.users(account_type, status);
CREATE INDEX IF NOT EXISTS idx_users_active_account_type
  ON public.users(status, account_type, deleted_at, created_at DESC)
  WHERE deleted_at IS NULL AND status = 'active' AND account_type <> 'admin';

-- 2) Extend the permission catalog to include app-facing features.
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
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label;

WITH permission_pairs(module_name, action_names) AS (
  VALUES
    ('admin', ARRAY['access']),
    ('dashboard', ARRAY['view']),
    ('feed', ARRAY['view']),
    ('search', ARRAY['view']),
    ('network', ARRAY['view', 'follow', 'connect', 'block']),
    ('messages', ARRAY['view', 'send']),
    ('notifications', ARRAY['view', 'edit']),
    ('profile', ARRAY['view', 'edit']),
    ('cvs', ARRAY['view', 'create', 'edit', 'delete']),
    ('users', ARRAY['view', 'create', 'edit', 'delete', 'export', 'suspend', 'ban', 'restore']),
    ('companies', ARRAY['view', 'follow', 'edit', 'suspend', 'moderate', 'restore']),
    ('jobs', ARRAY['view', 'create', 'edit', 'apply', 'save', 'moderate', 'delete']),
    ('posts', ARRAY['view', 'create', 'edit', 'comment', 'react', 'share', 'vote', 'moderate', 'delete']),
    ('reports', ARRAY['create', 'view', 'moderate', 'status']),
    ('appeals', ARRAY['view', 'create', 'moderate']),
    ('audit', ARRAY['view']),
    ('contacts', ARRAY['create', 'view', 'reply']),
    ('brand', ARRAY['view', 'edit']),
    ('report_types', ARRAY['view', 'create', 'edit', 'delete']),
    ('lookups', ARRAY['view', 'create', 'edit', 'delete']),
    ('settings', ARRAY['view', 'edit', 'maintenance']),
    ('roles', ARRAY['view', 'create', 'edit', 'delete'])
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
ON CONFLICT (name) DO UPDATE
SET label = EXCLUDED.label;

-- 3) Default RBAC roles. They are normal roles and can be assigned via role_id.
INSERT INTO public.roles (name, description, is_system) VALUES
  ('admin', 'Quản trị viên toàn quyền', TRUE),
  ('member', 'Thành viên thường', TRUE),
  ('company', 'Nhà tuyển dụng', TRUE),
  ('content_moderator', 'Người duyệt nội dung', FALSE),
  ('user_manager', 'Quản lý người dùng', FALSE),
  ('support_agent', 'Hỗ trợ khách hàng', FALSE)
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description,
    is_system = EXCLUDED.is_system,
    deleted_at = NULL,
    updated_at = NOW();

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role_id INT NULL REFERENCES public.roles(id);

UPDATE public.users u
   SET role_id = r.id
  FROM public.roles r
 WHERE u.role_id IS NULL
   AND r.name = u.account_type;

CREATE INDEX IF NOT EXISTS idx_users_role_id
  ON public.users(role_id) WHERE deleted_at IS NULL;

-- 4) Replace seeded role permissions with the dynamic catalog.
DELETE FROM public.role_permissions
 WHERE role_id IN (
   SELECT id FROM public.roles
    WHERE name IN (
      'admin',
      'member',
      'company',
      'content_moderator',
      'user_manager',
      'support_agent'
    )
 );

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM public.roles r
 CROSS JOIN public.permissions p
 WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

WITH role_permission_seed(role_name, permission_name) AS (
  VALUES
    ('member', 'feed.view'),
    ('member', 'search.view'),
    ('member', 'network.view'),
    ('member', 'network.follow'),
    ('member', 'network.connect'),
    ('member', 'network.block'),
    ('member', 'messages.view'),
    ('member', 'messages.send'),
    ('member', 'notifications.view'),
    ('member', 'notifications.edit'),
    ('member', 'profile.view'),
    ('member', 'profile.edit'),
    ('member', 'cvs.view'),
    ('member', 'cvs.create'),
    ('member', 'cvs.edit'),
    ('member', 'cvs.delete'),
    ('member', 'companies.view'),
    ('member', 'companies.follow'),
    ('member', 'jobs.view'),
    ('member', 'jobs.apply'),
    ('member', 'jobs.save'),
    ('member', 'posts.view'),
    ('member', 'posts.create'),
    ('member', 'posts.edit'),
    ('member', 'posts.comment'),
    ('member', 'posts.react'),
    ('member', 'posts.share'),
    ('member', 'posts.vote'),
    ('member', 'posts.delete'),
    ('member', 'reports.create'),
    ('member', 'appeals.view'),
    ('member', 'appeals.create'),
    ('member', 'contacts.create'),
    ('member', 'settings.view'),
    ('member', 'settings.edit'),

    ('company', 'feed.view'),
    ('company', 'search.view'),
    ('company', 'network.view'),
    ('company', 'network.follow'),
    ('company', 'network.connect'),
    ('company', 'network.block'),
    ('company', 'messages.view'),
    ('company', 'messages.send'),
    ('company', 'notifications.view'),
    ('company', 'notifications.edit'),
    ('company', 'profile.view'),
    ('company', 'profile.edit'),
    ('company', 'companies.view'),
    ('company', 'companies.follow'),
    ('company', 'companies.edit'),
    ('company', 'jobs.view'),
    ('company', 'jobs.create'),
    ('company', 'jobs.edit'),
    ('company', 'posts.view'),
    ('company', 'posts.create'),
    ('company', 'posts.edit'),
    ('company', 'posts.comment'),
    ('company', 'posts.react'),
    ('company', 'posts.share'),
    ('company', 'posts.vote'),
    ('company', 'posts.delete'),
    ('company', 'reports.create'),
    ('company', 'appeals.view'),
    ('company', 'appeals.create'),
    ('company', 'contacts.create'),
    ('company', 'settings.view'),
    ('company', 'settings.edit'),

    ('content_moderator', 'admin.access'),
    ('content_moderator', 'dashboard.view'),
    ('content_moderator', 'posts.view'),
    ('content_moderator', 'posts.moderate'),
    ('content_moderator', 'posts.delete'),
    ('content_moderator', 'reports.view'),
    ('content_moderator', 'reports.moderate'),
    ('content_moderator', 'reports.status'),
    ('content_moderator', 'appeals.view'),
    ('content_moderator', 'appeals.moderate'),
    ('content_moderator', 'audit.view'),

    ('user_manager', 'admin.access'),
    ('user_manager', 'dashboard.view'),
    ('user_manager', 'users.view'),
    ('user_manager', 'users.create'),
    ('user_manager', 'users.edit'),
    ('user_manager', 'users.delete'),
    ('user_manager', 'users.export'),
    ('user_manager', 'users.suspend'),
    ('user_manager', 'users.ban'),
    ('user_manager', 'users.restore'),
    ('user_manager', 'companies.view'),
    ('user_manager', 'companies.edit'),
    ('user_manager', 'companies.suspend'),
    ('user_manager', 'companies.moderate'),
    ('user_manager', 'companies.restore'),
    ('user_manager', 'roles.view'),
    ('user_manager', 'audit.view'),

    ('support_agent', 'admin.access'),
    ('support_agent', 'dashboard.view'),
    ('support_agent', 'contacts.view'),
    ('support_agent', 'contacts.reply'),
    ('support_agent', 'reports.view'),
    ('support_agent', 'audit.view')
)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
  FROM role_permission_seed s
  JOIN public.roles r ON r.name = s.role_name AND r.deleted_at IS NULL
  JOIN public.permissions p ON p.name = s.permission_name
ON CONFLICT DO NOTHING;

-- 5) RLS — idempotent: re-enable + recreate policies in case migration runs on fresh schema.
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

GRANT ALL ON public.roles TO service_role;
GRANT ALL ON public.modules TO service_role;
GRANT ALL ON public.actions TO service_role;
GRANT ALL ON public.permissions TO service_role;
GRANT ALL ON public.role_permissions TO service_role;

-- 6) Permission functions read only role_id, with a narrow legacy bootstrap fallback.
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
       AND (
         r.name = 'admin'
         OR (u.role_id IS NULL AND u.account_type = 'admin')
       )
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
  )
  OR EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.id = p_user_id
       AND u.deleted_at IS NULL
       AND u.role_id IS NULL
       AND u.account_type = 'admin'
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
    JOIN public.roles r
      ON r.id = u.role_id
     AND r.deleted_at IS NULL
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
     AND r.name = 'admin'
  UNION
  SELECT p.name::TEXT, m.name::TEXT, a.name::TEXT
    FROM public.users u
    CROSS JOIN public.permissions p
    JOIN public.modules m ON m.id = p.module_id
    JOIN public.actions a ON a.id = p.action_id
   WHERE u.id = p_user_id
     AND u.deleted_at IS NULL
     AND u.role_id IS NULL
     AND u.account_type = 'admin';
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(BIGINT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(BIGINT) TO anon, authenticated;

-- 7) New signups get both an account_type and a default RBAC role_id.
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

  INSERT INTO public.users (
    auth_id,
    email,
    role,
    account_type,
    role_id,
    status,
    email_verified_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_account_type,
    v_account_type,
    v_role_id,
    'active',
    COALESCE(NEW.email_confirmed_at, NOW())
  )
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
    VALUES (
      v_new_user_id,
      v_company_name,
      v_slug_base || '-' || substring(NEW.id::text, 1, 8),
      v_avatar
    )
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

NOTIFY pgrst, 'reload schema';
