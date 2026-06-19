-- =============================================================================
-- FIX: Grant SELECT on network_suggestions to authenticated role
-- 
-- The network_suggestions table is queried by get_network_overview and get_home_feed 
-- which run as SECURITY INVOKER. This requires the authenticated role to have 
-- SELECT permissions on the table, otherwise an RPC error (permission denied) occurs.
-- =============================================================================

GRANT SELECT ON public.network_suggestions TO authenticated;
