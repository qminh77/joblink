-- =============================================================================
-- JOBLINK MIGRATION 20260619_050 — DISABLE EMAIL VERIFICATION
-- =============================================================================
-- KHÔNG yêu cầu xác minh email khi đăng ký (không cần SMTP).
-- User mới luôn active ngay sau signup.
-- =============================================================================

INSERT INTO system_settings (setting_key, setting_group, value, encrypted) VALUES
    ('require_email_verification', 'security', 'false'::jsonb, FALSE)
ON CONFLICT (setting_key) DO UPDATE SET value = 'false'::jsonb;

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

-- =============================================================================
-- END MIGRATION 20260619_050
-- =============================================================================
