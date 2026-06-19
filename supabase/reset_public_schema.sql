-- =============================================================================
-- JOBLINK RESET PUBLIC SCHEMA
-- Destructive: run this before schema.sql only when you want a clean database.
-- It drops Joblink objects in public and Joblink storage policies.
-- =============================================================================

BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'storage'
       AND tablename = 'objects'
       AND policyname IN (
         'authenticated users can upload',
         'everyone can view',
         'owner can delete',
         'uploads: authenticated insert into own folder',
         'uploads: public read',
         'uploads: owner delete',
         'cvs: authenticated insert own folder',
         'cvs: owner select',
         'cvs: owner delete'
       )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relkind, c.oid::regclass::text AS object_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('v', 'm')
     ORDER BY c.relkind DESC, c.relname
  LOOP
    EXECUTE format('DROP %s IF EXISTS %s CASCADE',
      CASE r.relkind WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'VIEW' END,
      r.object_name
    );
  END LOOP;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.oid::regclass::text AS object_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r', 'p')
     ORDER BY c.relname
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %s CASCADE', r.object_name);
  END LOOP;
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS object_name
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND NOT EXISTS (
         SELECT 1
           FROM pg_depend d
          WHERE d.objid = p.oid
            AND d.deptype = 'e'
       )
     ORDER BY p.proname
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', r.object_name);
  END LOOP;
END $$;

COMMIT;

-- Then run:
--   schema.sql
--
-- Supabase protects storage buckets from direct SQL deletes. Delete unused
-- legacy buckets such as "post-media" from Dashboard Storage or the Storage API
-- after confirming they contain no files you still need.
