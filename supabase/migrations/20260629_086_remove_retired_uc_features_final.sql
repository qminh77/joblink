-- Migration 086: final cleanup for retired SRS/UC features.
-- Idempotent by design so production can run it after older cleanup migrations.
-- Removes: poll/vote leftovers, job alerts, interview pipeline tables/functions,
-- contact/appeals/brand/lookups/report-types RBAC, report_types table,
-- user export/post vote permissions, reCAPTCHA/passkey/2FA leftovers.

BEGIN;

-- Poll / vote bài viết.
DELETE FROM public.notifications
WHERE type = 'poll_vote';

DELETE FROM public.notification_preferences
WHERE type = 'poll_vote';

ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS chk_post_type;

UPDATE public.posts
SET post_type = 'text',
    media = CASE
      WHEN media ? 'pollOptions' THEN media - 'pollOptions'
      ELSE media
    END
WHERE post_type = 'poll';

ALTER TABLE public.posts
  ADD CONSTRAINT chk_post_type
  CHECK (post_type IN ('text', 'image', 'video', 'article'));

DO $$
BEGIN
  IF to_regclass('public.poll_votes') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_poll_votes_counter ON public.poll_votes';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.create_poll_post(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.increment_poll_vote_count(BIGINT);
DROP FUNCTION IF EXISTS public.poll_votes_counter_trigger();
DROP TABLE IF EXISTS public.poll_votes CASCADE;
DROP TABLE IF EXISTS public.poll_options CASCADE;

-- Job alerts + recruitment pipeline sâu.
DROP FUNCTION IF EXISTS public.schedule_interview(BIGINT, TIMESTAMPTZ, INT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.schedule_interview(BIGINT, TIMESTAMPTZ, INT, TEXT);
DROP FUNCTION IF EXISTS public.respond_interview(BIGINT, BOOLEAN);
DROP FUNCTION IF EXISTS public.update_application_status(BIGINT, TEXT, TEXT);

DROP TABLE IF EXISTS public.interview_schedules CASCADE;
DROP TABLE IF EXISTS public.application_status_history CASCADE;
DROP TABLE IF EXISTS public.job_alerts CASCADE;

UPDATE public.job_applications
SET status = CASE
  WHEN status = 'withdrawn' THEN 'withdrawn'
  WHEN status IN ('closed', 'rejected') THEN 'closed'
  ELSE 'submitted'
END
WHERE status NOT IN ('submitted', 'withdrawn', 'closed');

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS chk_app_status;
ALTER TABLE public.job_applications
  ADD CONSTRAINT chk_app_status
  CHECK (status IN ('submitted', 'withdrawn', 'closed'));
ALTER TABLE public.job_applications
  ALTER COLUMN status SET DEFAULT 'submitted';

-- Contact, appeals, brand/lookups/report-types and obsolete RBAC permissions.
DELETE FROM public.role_permissions rp
USING public.permissions p
JOIN public.modules m ON m.id = p.module_id
WHERE rp.permission_id = p.id
  AND (
    m.name IN ('appeals', 'contacts', 'brand', 'lookups', 'report_types')
    OR p.name IN ('users.export', 'posts.vote')
  );

DELETE FROM public.permissions p
USING public.modules m
WHERE p.module_id = m.id
  AND (
    m.name IN ('appeals', 'contacts', 'brand', 'lookups', 'report_types')
    OR p.name IN ('users.export', 'posts.vote')
  );

DELETE FROM public.modules
WHERE name IN ('appeals', 'contacts', 'brand', 'lookups', 'report_types');

DELETE FROM public.actions a
WHERE a.name IN ('export', 'vote', 'reply')
  AND NOT EXISTS (
    SELECT 1 FROM public.permissions p
    WHERE p.action_id = a.id
  );

DELETE FROM public.role_permissions rp
USING public.roles r
WHERE rp.role_id = r.id
  AND r.name = 'support_agent';

DELETE FROM public.roles
WHERE name = 'support_agent';

DROP TABLE IF EXISTS public.contact_submissions CASCADE;
DROP TABLE IF EXISTS public.appeals CASCADE;
DROP TABLE IF EXISTS public.report_types CASCADE;

-- Public/system advanced settings removed from the mini scope.
DELETE FROM public.system_settings
WHERE setting_key IN (
  'recaptcha_enabled',
  'recaptcha_site_key',
  'recaptcha_secret',
  'passkey_enabled',
  'require_2fa_admin',
  'contact_address',
  'contact_email',
  'contact_phone',
  'contact_content',
  'contact_map_url'
);

ALTER TABLE public.users DROP COLUMN IF EXISTS two_fa_enabled;
ALTER TABLE public.users DROP COLUMN IF EXISTS two_fa_secret;

COMMIT;
