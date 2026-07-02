-- Speed up the posts tab on /search. The query uses ILIKE '%q%' over
-- active, non-deleted post content, so a partial trigram index avoids scans
-- growing with the whole posts table.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_posts_content_trgm
    ON public.posts USING gin (content gin_trgm_ops)
    WHERE deleted_at IS NULL AND status = 'active';
