-- =============================================================================
-- JOBLINK MIGRATION 20260521_006 — TRIGGER SECURITY DEFINER
-- =============================================================================
-- Mục tiêu:
--   Các trigger function viết sang bảng khác (audit_logs, users) đang chạy với
--   quyền của caller (INVOKER). Khi RLS bật trên `audit_logs` (Supabase default
--   bật RLS, không có policy INSERT cho `authenticated`) → user xoá bài bị lỗi:
--     new row violates row-level security policy for table "audit_logs"
--
--   Fix: recreate dưới dạng SECURITY DEFINER (chạy bằng owner = postgres) kèm
--   `SET search_path = pg_catalog, public` để tránh search-path hijack.
--   Trigger nội bộ của hệ thống, không phụ thuộc RLS của caller → đúng pattern.
--
-- Idempotent: CREATE OR REPLACE đè lại không lỗi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Audit triggers (soft delete) — ghi audit_logs
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.joblink_audit_soft_delete_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
        VALUES('soft_delete', 'users', NEW.id,
               jsonb_build_object('email', OLD.email, 'role', OLD.role, 'status', OLD.status));
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.joblink_audit_soft_delete_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
        VALUES('soft_delete', 'posts', NEW.id,
               jsonb_build_object('author_id', OLD.author_id, 'status', OLD.status));
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.joblink_audit_soft_delete_jobs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
        VALUES('soft_delete', 'jobs', NEW.id,
               jsonb_build_object('company_user_id', OLD.company_user_id, 'title', OLD.title, 'status', OLD.status));
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.joblink_audit_soft_delete_company_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        INSERT INTO public.audit_logs(action, entity_type, entity_id, old_data)
        VALUES('soft_delete', 'company_profiles', NEW.id,
               jsonb_build_object('user_id', OLD.user_id, 'name', OLD.name, 'verification_status', OLD.verification_status));
    END IF;
    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Counter triggers — cập nhật public.users (RLS chỉ cho owner UPDATE row
--    của mình, trong khi connection counter cần đụng cả 2 users → cần DEFINER)
-- -----------------------------------------------------------------------------
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
        IF NEW.status = 'accepted'
           AND OLD.status = 'accepted'
           AND (OLD.requester_id, OLD.receiver_id)
               IS DISTINCT FROM (NEW.requester_id, NEW.receiver_id) THEN
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

-- =============================================================================
-- END MIGRATION 20260521_006
-- =============================================================================
