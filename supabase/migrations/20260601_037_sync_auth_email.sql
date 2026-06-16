-- =============================================================================
-- JOBLINK MIGRATION 20260601_037 — SYNC AUTH EMAIL -> public.users  (UC-66)
-- =============================================================================
-- handle_new_user() chỉ chạy AFTER INSERT auth.users (tạo public.users). Khi
-- người dùng ĐỔI email (UC-66) qua supabase.auth.updateUser, email chỉ thay đổi
-- ở auth.users sau khi xác nhận qua link — public.users.email sẽ lệch nếu không
-- đồng bộ. Trigger dưới đồng bộ email + email_verified_at khi auth.users thay
-- đổi email hoặc email_confirmed_at. Cũng giúp lật pending_verification -> active
-- ngay khi xác minh email lần đầu. KHÔNG đụng tới trạng thái suspended/banned.
-- SECURITY DEFINER để ghi public.users bất kể RLS của caller.
-- Idempotent.
-- =============================================================================

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
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_update();

-- =============================================================================
-- END MIGRATION 20260601_037
-- =============================================================================
