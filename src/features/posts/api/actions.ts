"use server"

// SRS UC Trace - M04 Bang tin va bai viet:
// UC-27 Dang bai; UC-28 Sua/xoa bai; UC-29 Cam xuc; UC-30 Binh luan/xoa binh luan; UC-31 Chia se; UC-32 Tim nguoi de nhac ten.
// Flow: /home|/posts/[id] components/hooks -> post action facade -> create/manage/engagement/read actions -> post services/repos/RPC.

import { createPostAction as createPost } from "./create-actions"
import {
  createCommentAction as createComment,
  deleteCommentAction as deleteComment,
  sharePostAction as sharePost,
  toggleReactionAction as toggleReaction,
} from "./engagement-actions"
import {
  deletePostAction as deletePost,
  updatePostAction as updatePost,
} from "./manage-actions"
import {
  getFeedPageAction as getFeedPage,
  getHomeStatsAction as getHomeStats,
  getPostCommentsAction as getPostComments,
  getUserPostsPageAction as getUserPostsPage,
  searchMentionableUsersAction as searchMentionableUsers,
} from "./read-actions"

export type { MentionableUser } from "../types"

export async function getFeedPageAction(
  cursor: Parameters<typeof getFeedPage>[0],
) {
  return getFeedPage(cursor)
}

export async function getHomeStatsAction() {
  return getHomeStats()
}

export async function getUserPostsPageAction(
  targetUserId: Parameters<typeof getUserPostsPage>[0],
  cursor: Parameters<typeof getUserPostsPage>[1],
) {
  return getUserPostsPage(targetUserId, cursor)
}

export async function getPostCommentsAction(
  postId: Parameters<typeof getPostComments>[0],
  limit?: Parameters<typeof getPostComments>[1],
) {
  return getPostComments(postId, limit)
}

export async function searchMentionableUsersAction(
  query: Parameters<typeof searchMentionableUsers>[0],
  limit?: Parameters<typeof searchMentionableUsers>[1],
) {
  return searchMentionableUsers(query, limit)
}

export async function createPostAction(input: Parameters<typeof createPost>[0]) {
  return createPost(input)
}

export async function toggleReactionAction(
  postId: Parameters<typeof toggleReaction>[0],
) {
  return toggleReaction(postId)
}

export async function createCommentAction(
  input: Parameters<typeof createComment>[0],
) {
  return createComment(input)
}

export async function deleteCommentAction(
  commentId: Parameters<typeof deleteComment>[0],
) {
  return deleteComment(commentId)
}

export async function sharePostAction(input: Parameters<typeof sharePost>[0]) {
  return sharePost(input)
}

export async function updatePostAction(input: Parameters<typeof updatePost>[0]) {
  return updatePost(input)
}

export async function deletePostAction(
  postId: Parameters<typeof deletePost>[0],
) {
  return deletePost(postId)
}
