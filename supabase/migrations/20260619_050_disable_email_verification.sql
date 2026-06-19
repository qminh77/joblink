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
BEGIN
  INSERT INTO public.users (auth_id, email, role, status, email_verified_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    'active',
    NOW()
  );
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

-- =============================================================================
-- END MIGRATION 20260619_050
-- =============================================================================
