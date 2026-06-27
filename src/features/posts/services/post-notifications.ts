import "server-only"

import type { CurrentUser } from "@/features/auth/types"
import { createNotification } from "@/features/notifications/lib/create-notification"

import { getCommentAuthorId, getPostAuthorId } from "../data/posts.privileged"
import type { SharedOriginal } from "../lib/media"
import { extractMentionedUserIds, mentionsToPlainText } from "../lib/mentions"

// Điều phối side-effect notification cho posts. Tách khỏi action để action chỉ
// còn: validate → ghi DB → gọi service → revalidate. Mỗi hàm tự bỏ qua trường
// hợp "tự thông báo cho chính mình".

function excerpt(text: string, max = 140): string {
  const trimmed = text.trim().replace(/\s+/g, " ")
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed
}

export async function notifyReaction(opts: {
  postId: number
  reactionType: string
  current: CurrentUser
}): Promise<void> {
  const me = opts.current.appUser.id
  const authorId = await getPostAuthorId(opts.postId)
  if (!authorId || authorId === me) return
  await createNotification({
    userId: authorId,
    type: "post_reaction",
    payload: {
      type: "post_reaction",
      userId: me,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
      postId: opts.postId,
      reactionType: opts.reactionType,
    },
  })
}

export async function notifyComment(opts: {
  comment: { id: number; postId: number; content: string }
  parentId: number | null
  current: CurrentUser
}): Promise<void> {
  const me = opts.current.appUser.id
  const { id, postId, content } = opts.comment

  // Bước 1: post author + parent comment author (nếu là reply).
  const commentTargets = new Set<number>()
  const postAuthorId = await getPostAuthorId(postId)
  if (postAuthorId && postAuthorId !== me) commentTargets.add(postAuthorId)
  if (opts.parentId) {
    const parentAuthorId = await getCommentAuthorId(opts.parentId)
    if (parentAuthorId && parentAuthorId !== me) commentTargets.add(parentAuthorId)
  }

  const actor = {
    userId: me,
    displayName: opts.current.profile.displayName,
    avatarUrl: opts.current.profile.avatarUrl,
    postId,
    commentId: id,
    excerpt: excerpt(mentionsToPlainText(content)),
  }

  // Bước 2: mention — chỉ gửi cho ai chưa nằm trong commentTargets, tránh trùng.
  const mentionTargets = new Set<number>()
  for (const mentionedId of extractMentionedUserIds(content)) {
    if (mentionedId === me || commentTargets.has(mentionedId)) continue
    mentionTargets.add(mentionedId)
  }

  await Promise.all([
    ...Array.from(commentTargets).map((userId) =>
      createNotification({
        userId,
        type: "post_comment",
        payload: { type: "post_comment", ...actor },
      }),
    ),
    ...Array.from(mentionTargets).map((userId) =>
      createNotification({
        userId,
        type: "comment_mention",
        payload: { type: "comment_mention", ...actor },
      }),
    ),
  ])
}

export async function notifyShare(opts: {
  snapshot: SharedOriginal
  shareId: number
  commentText: string
  current: CurrentUser
}): Promise<void> {
  const me = opts.current.appUser.id
  if (opts.snapshot.authorId === me) return
  await createNotification({
    userId: opts.snapshot.authorId,
    type: "post_share",
    payload: {
      type: "post_share",
      userId: me,
      displayName: opts.current.profile.displayName,
      avatarUrl: opts.current.profile.avatarUrl,
      postId: opts.snapshot.id,
      shareId: opts.shareId,
      excerpt: opts.commentText ? excerpt(opts.commentText) : null,
    },
  })
}
