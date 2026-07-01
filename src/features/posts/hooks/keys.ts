export const FEED_QUERY_KEY = ["home-feed"] as const
export const HOME_STATS_KEY = ["home", "stats"] as const
export const POST_COMMENTS_BASE_KEY = ["post-comments"] as const
export const POST_COMMENTS_PREFIX = (postId: number) =>
  [...POST_COMMENTS_BASE_KEY, postId] as const
export const POST_COMMENTS_KEY = (postId: number) =>
  [...POST_COMMENTS_PREFIX(postId)] as const
export const POST_COMMENTS_LIMIT_KEY = (postId: number, limit: number) =>
  [...POST_COMMENTS_PREFIX(postId), limit] as const
export const USER_POSTS_QUERY_KEY = (userId: number) =>
  ["user-posts", userId] as const
