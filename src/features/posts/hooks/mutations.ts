"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useCurrentUser } from "@/features/auth/components/current-user-provider"

import {
  createCommentAction,
  createPostAction,
  deleteCommentAction,
  deletePostAction,
  sharePostAction,
  toggleReactionAction,
  updatePostAction,
} from "../api/actions"
import type { CreatePostActionInput, FeedComment } from "../types"
import {
  applyToAllPostCaches,
  removePostFromAllCaches,
  usePrependPost,
  type FeedCache,
  type UserPostsCache,
} from "./cache"
import {
  FEED_QUERY_KEY,
  POST_COMMENTS_BASE_KEY,
  POST_COMMENTS_PREFIX,
} from "./keys"

export function useCreatePost() {
  const prepend = usePrependPost()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: CreatePostActionInput) => {
      const result = await createPostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (post) => {
      prepend(post)
      toast.success(t("createSuccess"))
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useUpdatePost() {
  const qc = useQueryClient()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      postId: number
      content: string
      visibility: "public" | "connections" | "private"
      mediaItems?: { url: string; width?: number; height?: number }[]
    }) => {
      const result = await updatePostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (updated) => {
      applyToAllPostCaches(qc, updated.postId, (post) => {
        return {
          ...post,
          content: updated.content,
          visibility: updated.visibility,
          media: updated.media,
          postType: updated.postType,
        }
      })
      toast.success(t("updateSuccess"))
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useToggleReaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (postId: number) => {
      const result = await toggleReactionAction(postId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      await qc.cancelQueries({ queryKey: ["user-posts"] })
      const previousFeed = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      const previousUserPosts = qc.getQueriesData<UserPostsCache>({
        queryKey: ["user-posts"],
      })
      applyToAllPostCaches(qc, postId, (post) => ({
        ...post,
        viewerReacted: !post.viewerReacted,
        reactionCount: post.viewerReacted
          ? Math.max(0, post.reactionCount - 1)
          : post.reactionCount + 1,
      }))
      return { previousFeed, previousUserPosts }
    },
    onError: (error: Error, _postId, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(FEED_QUERY_KEY, context.previousFeed)
      }
      if (context?.previousUserPosts) {
        for (const [key, data] of context.previousUserPosts) {
          qc.setQueryData(key, data)
        }
      }
      toast.error(error.message)
    },
  })
}

export function useCreateComment() {
  const qc = useQueryClient()
  const user = useCurrentUser()
  return useMutation({
    mutationFn: async (input: {
      postId: number
      content: string
      parentId?: number | null
    }) => {
      const result = await createCommentAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data.comment
    },
    onMutate: async (input) => {
      const commentsKey = POST_COMMENTS_PREFIX(input.postId)
      await qc.cancelQueries({ queryKey: commentsKey })
      const previousComments = qc.getQueriesData<FeedComment[]>({
        queryKey: commentsKey,
      })

      const tempId = -Date.now()
      const tempComment: FeedComment = {
        id: tempId,
        postId: input.postId,
        userId: user.id,
        parentId: input.parentId ?? null,
        content: input.content,
        createdAt: new Date().toISOString(),
        author: {
          userId: user.id,
          role: user.role,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          headline: user.headline,
        },
      }

      applyToAllPostCaches(qc, input.postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }))

      qc.setQueriesData<FeedComment[]>(
        { queryKey: commentsKey },
        (prev) => (prev ? [...prev, tempComment] : [tempComment]),
      )

      return { previousComments, tempId }
    },
    onSuccess: (realComment, input, context) => {
      qc.setQueriesData<FeedComment[]>(
        { queryKey: POST_COMMENTS_PREFIX(realComment.postId) },
        (prev) => {
          if (!prev) return [realComment]
          return prev.map((c) =>
            c.id === context?.tempId ? realComment : c,
          )
        },
      )
    },
    onError: (error: Error, input, context) => {
      if (context?.previousComments) {
        for (const [key, data] of context.previousComments) {
          qc.setQueryData(key, data)
        }
      }
      applyToAllPostCaches(qc, input.postId, (post) => ({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      }))
      toast.error(error.message)
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  const t = useTranslations("feed")
  return useMutation({
    mutationFn: async (commentId: number) => {
      const result = await deleteCommentAction(commentId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: POST_COMMENTS_BASE_KEY })
      const previousComments = qc.getQueriesData<FeedComment[]>({
        queryKey: POST_COMMENTS_BASE_KEY,
      })
      const postId = previousComments
        .flatMap(([, comments]) => comments ?? [])
        .find((comment) => comment.id === commentId)?.postId

      qc.setQueriesData<FeedComment[]>(
        { queryKey: POST_COMMENTS_BASE_KEY },
        (prev) =>
          prev ? prev.filter((comment) => comment.id !== commentId) : prev,
      )

      if (postId != null) {
        applyToAllPostCaches(qc, postId, (post) => ({
          ...post,
          commentCount: Math.max(0, post.commentCount - 1),
        }))
      }

      return { previousComments, postId }
    },
    onSuccess: ({ commentId, postId }, _commentId, context) => {
      qc.setQueriesData<FeedComment[]>(
        { queryKey: POST_COMMENTS_PREFIX(postId) },
        (prev) =>
          prev ? prev.filter((comment) => comment.id !== commentId) : prev,
      )
      if (context?.postId == null) {
        applyToAllPostCaches(qc, postId, (post) => ({
          ...post,
          commentCount: Math.max(0, post.commentCount - 1),
        }))
      }
      toast.success(t("deleteCommentSuccess"))
    },
    onError: (error: Error, _commentId, context) => {
      if (context?.previousComments) {
        for (const [key, data] of context.previousComments) {
          qc.setQueryData(key, data)
        }
      }
      if (context?.postId != null) {
        applyToAllPostCaches(qc, context.postId, (post) => ({
          ...post,
          commentCount: post.commentCount + 1,
        }))
      }
      toast.error(error.message)
    },
  })
}

export function useSharePost() {
  const qc = useQueryClient()
  const prepend = usePrependPost()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      postId: number
      commentContent?: string | null
    }) => {
      const result = await sharePostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: ({ post }) => {
      const media = post.media as { originalPostId?: number } | null
      const originalId = media?.originalPostId
      if (typeof originalId === "number") {
        applyToAllPostCaches(qc, originalId, (item) => ({
          ...item,
          shareCount: item.shareCount + 1,
        }))
      }
      prepend(post)
      toast.success(t("shareSuccess"))
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (postId: number) => {
      const result = await deletePostAction(postId)
      if (!result.ok) throw new Error(result.error)
      return postId
    },
    onMutate: async (postId) => {
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      await qc.cancelQueries({ queryKey: ["user-posts"] })
      const previousFeed = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      const previousUserPosts = qc.getQueriesData<UserPostsCache>({
        queryKey: ["user-posts"],
      })
      removePostFromAllCaches(qc, postId)
      return { previousFeed, previousUserPosts }
    },
    onError: (error: Error, _postId, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(FEED_QUERY_KEY, context.previousFeed)
      }
      if (context?.previousUserPosts) {
        for (const [key, data] of context.previousUserPosts) {
          qc.setQueryData(key, data)
        }
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success(t("deleteSuccess"))
    },
  })
}
