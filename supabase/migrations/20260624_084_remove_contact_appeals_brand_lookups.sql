-- =============================================================================
-- MIGRATION: Remove contact_submissions, appeals tables + RBAC + settings
-- Drops tables, cleans up RBAC modules/permissions, and removes system_settings
-- keys for features that have been removed from the application.
-- =============================================================================

BEGIN;

-- 1. Clean up RBAC: role_permissions for appeals, contacts, brand, lookups
DELETE FROM public.role_permissions
WHERE permission_id IN (
  SELECT p.id
  FROM public.permissions p
  JOIN public.modules m ON m.id = p.module_id
  WHERE m.name IN ('appeals', 'contacts', 'brand', 'lookups')
);

-- 2. Clean up RBAC: permissions for these modules
DELETE FROM public.permissions
WHERE module_id IN (
  SELECT id FROM public.modules
  WHERE name IN ('appeals', 'contacts', 'brand', 'lookups')
);

-- 3. Clean up RBAC: modules themselves
DELETE FROM public.modules
WHERE name IN ('appeals', 'contacts', 'brand', 'lookups');

-- 4. Drop contact_submissions table (cascades to policies, indices)
DROP TABLE IF EXISTS public.contact_submissions CASCADE;

-- 5. Drop appeals table (cascades to policies, indices)
DROP TABLE IF EXISTS public.appeals CASCADE;

-- 6. Remove contact-related system_settings keys
DELETE FROM public.system_settings
WHERE setting_key IN (
  'contact_email',
  'contact_phone',
  'contact_address',
  'contact_content',
  'contact_map_url'
);

COMMIT;
