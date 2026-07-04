-- MIGRATION: Remove maintenance feature
-- 1. Remove maintenance system settings
DELETE FROM system_settings WHERE setting_group = 'maintenance' OR setting_key IN ('maintenance_mode', 'maintenance_message');

-- 2. Remove maintenance action from settings module permissions
DELETE FROM public.role_permissions
WHERE permission_id IN (
    SELECT id FROM public.permissions WHERE name = 'settings.maintenance'
);

DELETE FROM public.permissions WHERE name = 'settings.maintenance';

-- 3. Remove maintenance action
DELETE FROM public.actions WHERE name = 'maintenance';
