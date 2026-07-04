-- =============================================================================
-- JOBLINK MIGRATION 20260529_023 — POSTS VISIBILITY RLS
-- =============================================================================
-- Trước migration này, bảng `posts` (và các bảng engagement) KHÔNG bật RLS.
-- Visibility (public / connections / private) chỉ được lọc bên trong các RPC
-- get_home_feed / get_user_posts ở tầng ứng dụng. Nghĩa là bất kỳ client nào
-- cầm anon key đều có thể gọi thẳng PostgREST (supabase.from('posts').select())
-- để đọc — kể cả các bài 'private' của người khác — hoặc sửa/xoá bài người khác.
--
-- Migration này enforce visibility ở tầng database (defense in depth):
--   • posts          — SELECT theo visibility; INSERT/UPDATE/DELETE chỉ author.
--   • post_reactions — gắn quyền xem/tương tác vào việc có xem được bài gốc.
--   • post_comments  — tương tự, cộng quyền sửa/xoá comment của chính mình.
--   • post_shares    — tương tự.
--
-- Các RPC hiện có là SECURITY INVOKER nên giờ chạy dưới RLS; chúng vốn đã lọc
-- đúng tập bài visible nên kết quả không đổi. Admin dùng service-role (bypass
-- RLS) nên dashboard/audit không bị ảnh hưởng.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers — SECURITY DEFINER để đọc connections/posts mà không đệ quy RLS.
-- DROP trước khi tạo: nếu DB đã có hàm cùng tên với tên tham số khác,
-- CREATE OR REPLACE sẽ báo "cannot change name of input parameter".
-- CASCADE để re-run được: ở lần chạy sau, mọi thứ phụ thuộc 2 hàm này CHỈ là
-- các RLS policy bên dưới — chúng bị drop kèm rồi được migration tạo lại ngay.
-- DROP can_view_post trước (vì nó tham chiếu are_connected).
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.can_view_post(BIGINT) CASCADE;
DROP FUNCTION IF EXISTS public.are_connected(BIGINT, BIGINT) CASCADE;

CREATE OR REPLACE FUNCTION public.are_connected(p_a BIGINT, p_b BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.connections c
     WHERE c.status = 'accepted'
       AND ((c.requester_id = p_a AND c.receiver_id = p_b)
         OR (c.requester_id = p_b AND c.receiver_id = p_a))
  );
$$;

GRANT EXECUTE ON FUNCTION public.are_connected(BIGINT, BIGINT) TO anon, authenticated;

-- Người dùng hiện tại có quyền xem bài p_post_id không (theo visibility).
-- SECURITY DEFINER: đọc posts bypass RLS để tránh đệ quy policy.
CREATE OR REPLACE FUNCTION public.can_view_post(post_id BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.posts p
     WHERE p.id = can_view_post.post_id
       AND p.deleted_at IS NULL
       AND (
            p.visibility = 'public'
         OR p.author_id = public.auth_user_id()
         OR (p.visibility = 'connections'
             AND public.are_connected(public.auth_user_id(), p.author_id))
         OR public.is_admin()
       )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_view_post(BIGINT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS posts_admin_all     ON public.posts;
DROP POLICY IF EXISTS posts_select_visible ON public.posts;
DROP POLICY IF EXISTS posts_insert_own    ON public.posts;
DROP POLICY IF EXISTS posts_update_own    ON public.posts;
DROP POLICY IF EXISTS posts_delete_own    ON public.posts;

CREATE POLICY posts_admin_all
  ON public.posts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SELECT theo visibility. Anon (auth_user_id() = NULL) chỉ thấy bài 'public'.
CREATE POLICY posts_select_visible
  ON public.posts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
         visibility = 'public'
      OR author_id = public.auth_user_id()
      OR (visibility = 'connections'
          AND public.are_connected(public.auth_user_id(), author_id))
    )
  );

CREATE POLICY posts_insert_own
  ON public.posts
  FOR INSERT
  WITH CHECK (author_id = public.auth_user_id());

CREATE POLICY posts_update_own
  ON public.posts
  FOR UPDATE
  USING (author_id = public.auth_user_id())
  WITH CHECK (author_id = public.auth_user_id());

CREATE POLICY posts_delete_own
  ON public.posts
  FOR DELETE
  USING (author_id = public.auth_user_id());

-- -----------------------------------------------------------------------------
-- post_reactions — chỉ thao tác/đếm trên bài mình xem được.
-- -----------------------------------------------------------------------------
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_reactions_admin_all      ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_select_visible ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_insert_own     ON public.post_reactions;
DROP POLICY IF EXISTS post_reactions_delete_own     ON public.post_reactions;

CREATE POLICY post_reactions_admin_all
  ON public.post_reactions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY post_reactions_select_visible
  ON public.post_reactions
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY post_reactions_insert_own
  ON public.post_reactions
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));

CREATE POLICY post_reactions_delete_own
  ON public.post_reactions
  FOR DELETE
  USING (user_id = public.auth_user_id());

-- -----------------------------------------------------------------------------
-- post_comments — xem được nếu xem được bài; sửa/xoá comment của chính mình.
-- -----------------------------------------------------------------------------
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_comments_admin_all      ON public.post_comments;
DROP POLICY IF EXISTS post_comments_select_visible ON public.post_comments;
DROP POLICY IF EXISTS post_comments_insert_own     ON public.post_comments;
DROP POLICY IF EXISTS post_comments_update_own     ON public.post_comments;

CREATE POLICY post_comments_admin_all
  ON public.post_comments
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY post_comments_select_visible
  ON public.post_comments
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY post_comments_insert_own
  ON public.post_comments
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id() AND public.can_view_post(post_id));

CREATE POLICY post_comments_update_own
  ON public.post_comments
  FOR UPDATE
  USING (user_id = public.auth_user_id())
  WITH CHECK (user_id = public.auth_user_id());

-- -----------------------------------------------------------------------------
-- post_shares
-- -----------------------------------------------------------------------------
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS post_shares_admin_all      ON public.post_shares;
DROP POLICY IF EXISTS post_shares_select_visible ON public.post_shares;
DROP POLICY IF EXISTS post_shares_insert_own     ON public.post_shares;
DROP POLICY IF EXISTS post_shares_delete_own     ON public.post_shares;

CREATE POLICY post_shares_admin_all
  ON public.post_shares
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY post_shares_select_visible
  ON public.post_shares
  FOR SELECT
  USING (public.can_view_post(post_id));

CREATE POLICY post_shares_insert_own
  ON public.post_shares
  FOR INSERT
  WITH CHECK (user_id = public.auth_user_id());

CREATE POLICY post_shares_delete_own
  ON public.post_shares
  FOR DELETE
  USING (user_id = public.auth_user_id());

-- =============================================================================
-- END MIGRATION 20260529_023
-- =============================================================================
