-- Migration: Audit log performance RPCs
-- Adds count + entity type listing RPCs for the admin audit log page.

-- Count audit logs with optional filters (for pagination total)
CREATE OR REPLACE FUNCTION public.get_audit_log_count(
  p_search TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT count(*)::bigint
    FROM public.audit_logs a
   WHERE (p_action IS NULL OR a.action = p_action)
     AND (p_entity_type IS NULL OR a.entity_type = p_entity_type)
     AND (p_search IS NULL OR p_search = ''
          OR a.action ILIKE '%' || p_search || '%'
          OR a.entity_type ILIKE '%' || p_search || '%'
          OR a.reason ILIKE '%' || p_search || '%')
$$;

GRANT EXECUTE ON FUNCTION public.get_audit_log_count(TEXT, TEXT, TEXT) TO authenticated;

-- Get distinct entity_type values (for filter dropdown)
CREATE OR REPLACE FUNCTION public.get_distinct_audit_entity_types()
RETURNS TABLE(entity_type TEXT)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT DISTINCT a.entity_type
    FROM public.audit_logs a
   WHERE a.entity_type IS NOT NULL
   ORDER BY a.entity_type
$$;

GRANT EXECUTE ON FUNCTION public.get_distinct_audit_entity_types() TO authenticated;
