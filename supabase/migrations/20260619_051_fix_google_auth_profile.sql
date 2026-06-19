-- =============================================================================
-- JOBLINK MIGRATION 20260619_051 — FIX GOOGLE AUTH PROFILE
-- =============================================================================
-- Cập nhật trigger handle_new_user để lấy đúng thông tin name và avatar từ Google Auth.
-- Sửa lỗi dùng currval có thể gây lỗi hoặc không match chính xác với ID vừa tạo.
-- Tự động backfill (bổ sung) các profile bị thiếu do lỗi đăng nhập trước đó.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_new_user_id BIGINT;
  v_name TEXT;
  v_avatar TEXT;
BEGIN
  INSERT INTO public.users (auth_id, email, role, status, email_verified_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    'active',
    NOW()
  ) RETURNING id INTO v_new_user_id;

  v_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  v_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'member') = 'company' THEN
    INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
    VALUES (
      v_new_user_id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', v_name),
      COALESCE(
        regexp_replace(
          lower(COALESCE(NEW.raw_user_meta_data->>'company_name', v_name)),
          '[^a-z0-9]+', '-', 'g'
        ),
        'company'
      ) || '-' || substring(NEW.id::text, 1, 8),
      v_avatar
    );
  ELSE
    INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
    VALUES (
      v_new_user_id,
      v_name,
      v_avatar
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- BACKFILL CÁC PROFILE BỊ THIẾU ----------------------------------------------

-- Backfill member_profiles
INSERT INTO public.member_profiles (user_id, full_name, avatar_url)
SELECT 
  u.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  )
FROM public.users u
JOIN auth.users au ON au.id = u.auth_id
WHERE u.role = 'member'
  AND NOT EXISTS (
    SELECT 1 FROM public.member_profiles mp WHERE mp.user_id = u.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- Backfill company_profiles
INSERT INTO public.company_profiles (user_id, name, slug, logo_url)
SELECT 
  u.id,
  COALESCE(
    au.raw_user_meta_data->>'company_name',
    au.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  COALESCE(
    regexp_replace(
      lower(COALESCE(au.raw_user_meta_data->>'company_name', au.raw_user_meta_data->>'name', split_part(u.email, '@', 1))),
      '[^a-z0-9]+', '-', 'g'
    ),
    'company'
  ) || '-' || substring(u.auth_id::text, 1, 8),
  COALESCE(
    au.raw_user_meta_data->>'avatar_url',
    au.raw_user_meta_data->>'picture'
  )
FROM public.users u
JOIN auth.users au ON au.id = u.auth_id
WHERE u.role = 'company'
  AND NOT EXISTS (
    SELECT 1 FROM public.company_profiles cp WHERE cp.user_id = u.id
  )
ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- END MIGRATION 20260619_051
-- =============================================================================
