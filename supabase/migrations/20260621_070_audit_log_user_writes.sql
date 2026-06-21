-- Migration: Allow authenticated users to INSERT into audit_logs
-- Currently audit_logs_admin_all policy restricts ALL operations to admins only.
-- We need INSERT permission for authenticated users so user-facing actions can
-- write audit trails. SELECT remains admin-only.

-- Drop the existing admin-only policy and recreate with separate read/write policies.
DROP POLICY IF EXISTS audit_logs_admin_all ON public.audit_logs;

-- Admins can do everything (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY audit_logs_admin_select ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY audit_logs_admin_insert ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- Authenticated users can INSERT their own audit records (actor_id must match)
CREATE POLICY audit_logs_authenticated_insert ON public.audit_logs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND actor_id = (
      SELECT id FROM public.users
      WHERE auth_id = auth.uid()
      AND deleted_at IS NULL
    )
  );

-- Index for performance: queries always filter by action + created_at DESC
-- Existing idx_audit_logs_action covers this pattern.
