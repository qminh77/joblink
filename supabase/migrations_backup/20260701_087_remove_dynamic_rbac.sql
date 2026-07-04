-- Remove dynamic RBAC tables and return authorization to the 3 built-in roles.
-- The app now computes permissions from users.role: member, company, admin.

BEGIN;

-- 1) Normalize users.role before dropping the RBAC role catalog.
UPDATE public.users
   SET role = 'member',
       updated_at = NOW()
 WHERE role IS NULL
    OR role NOT IN ('member', 'company', 'admin');

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_role;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'member',
  ALTER COLUMN role SET NOT NULL,
  ADD CONSTRAINT chk_users_role CHECK (role IN ('member', 'company', 'admin'));

DROP INDEX IF EXISTS public.idx_users_role_id;
DROP INDEX IF EXISTS public.idx_users_account_type;
DROP INDEX IF EXISTS public.idx_users_account_type_status;
DROP INDEX IF EXISTS public.idx_users_active_account_type;

ALTER TABLE public.users DROP COLUMN IF EXISTS role_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS account_type;

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users(role, status);

-- 2) Drop dynamic RBAC RPCs. Permission checks are static in app code now.
DROP FUNCTION IF EXISTS public.user_has_permission(TEXT);
DROP FUNCTION IF EXISTS public.get_user_permissions(BIGINT);
DROP FUNCTION IF EXISTS public.has_permission(BIGINT, TEXT);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.auth_id::text = auth.uid()::text
       AND u.role = 'admin'
       AND u.status = 'active'
       AND u.deleted_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 3) Drop RBAC catalog tables. CASCADE removes policies, FK constraints, and grants.
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.actions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 4) Keep upload policy in sync with profile media paths used by the app.
DROP POLICY IF EXISTS "uploads: authenticated insert into own folder" ON storage.objects;
DROP POLICY IF EXISTS "uploads: owner delete" ON storage.objects;

CREATE POLICY "uploads: authenticated insert into own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] IN (
      'post-media',
      'member-avatar',
      'member-cover',
      'company-logo',
      'company-cover'
    )
    AND (storage.foldername(name))[4] = public.auth_user_id()::text
  );

CREATE POLICY "uploads: owner delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] IN (
      'post-media',
      'member-avatar',
      'member-cover',
      'company-logo',
      'company-cover'
    )
    AND (storage.foldername(name))[4] = public.auth_user_id()::text
  );

-- 5) Fix network suggestion skill matching after member_skills moved to name-only skills.
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
     WHERE role = 'member' AND status = 'active' AND deleted_at IS NULL
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
        SELECT COUNT(DISTINCT lower(ms2.name))
        FROM public.member_skills ms1
        JOIN public.member_skills ms2 ON lower(ms1.name) = lower(ms2.name)
        WHERE ms1.user_id = v_user.id AND ms2.user_id = candidate.id
      ) * 5
    AS score
    FROM public.users candidate
    WHERE candidate.id <> v_user.id
      AND candidate.role = 'member'
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

NOTIFY pgrst, 'reload schema';

COMMIT;
