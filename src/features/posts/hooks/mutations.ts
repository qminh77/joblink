"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import {
  createCommentAction,
  createPostAction,
  deleteCommentAction,
  deletePostAction,
  sharePostAction,
  toggleReactionAction,
  updatePostAction,
  voteAction,
} from "../api/actions"
import { buildPollMedia } from "../lib/poll"
import type { FeedComment } from "../types"
import {
  applyToAllPostCaches,
  removePostFromAllCaches,
  usePrependPost,
  type FeedCache,
  type UserPostsCache,
} from "./cache"
import {
  FEED_QUERY_KEY,
  POST_COMMENTS_KEY,
} from "./keys"

export function useCreatePost() {
  const prepend = usePrependPost()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async (input: {
      content: string
      visibility?: "public" | "connections" | "private"
      mediaItems?: { url: string; width?: number; height?: number }[]
      options?: string[]
      videoUrl?: string
    }) => {
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
      options?: { id?: number; optionText: string }[]
    }) => {
      const result = await updatePostAction(input)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onSuccess: (updated) => {
      applyToAllPostCaches(qc, updated.postId, (post) => {
        const upd = updated as Record<string, unknown>
        const newOptions = upd.pollOptions as
          | { id: number; optionText: string; voteCount: number }[]
          | undefined
        return {
          ...post,
          content: updated.content,
          visibility: updated.visibility,
          media: updated.media,
          postType: updated.postType,
          pollOptions: newOptions
            ? newOptions.map((option) => ({
                id: option.id,
                optionText: option.optionText,
                voteCount: option.voteCount,
                viewerVoted: false,
              }))
            : post.pollOptions,
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
    onSuccess: (comment) => {
      applyToAllPostCaches(qc, comment.postId, (post) => ({
        ...post,
        commentCount: post.commentCount + 1,
      }))
      qc.setQueryData<FeedComment[]>(
        POST_COMMENTS_KEY(comment.postId),
        (prev) => (prev ? [...prev, comment] : [comment]),
      )
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useVote() {
  const qc = useQueryClient()
  const t = useTranslations("posts")
  return useMutation({
    mutationFn: async ({
      postId,
      optionId,
    }: {
      postId: number
      optionId: number
    }) => {
      const result = await voteAction(postId, optionId)
      if (!result.ok) throw new Error(result.error)
      return result.data
    },
    onMutate: async ({ postId, optionId }) => {
      await qc.cancelQueries({ queryKey: FEED_QUERY_KEY })
      await qc.cancelQueries({ queryKey: ["user-posts"] })
      const previousFeed = qc.getQueryData<FeedCache>(FEED_QUERY_KEY)
      const previousUserPosts = qc.getQueriesData<UserPostsCache>({
        queryKey: ["user-posts"],
      })

      applyToAllPostCaches(qc, postId, (post) => {
        if (post.postType !== "poll" || !post.pollOptions) return post

        const updatedPollOptions = post.pollOptions.map((option) => ({
          ...option,
          voteCount:
            option.id === optionId ? option.voteCount + 1 : option.voteCount,
          viewerVoted: option.id === optionId,
        }))

        const updatedTotalVotes = updatedPollOptions.reduce(
          (sum, option) => sum + option.voteCount,
          0,
        )

        return {
          ...post,
          pollOptions: updatedPollOptions,
          media: buildPollMedia(
            updatedPollOptions.map(({ id, optionText, voteCount }) => ({
              id,
              optionText,
              voteCount,
            })),
            updatedTotalVotes,
          ),
        }
      })

      return { previousFeed, previousUserPosts }
    },
    onError: (error: Error, _vars, context) => {
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
      toast.success(t("voteSuccess"))
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
    onSuccess: ({ commentId, postId }) => {
      qc.setQueryData<FeedComment[]>(POST_COMMENTS_KEY(postId), (prev) =>
        prev ? prev.filter((comment) => comment.id !== commentId) : prev,
      )
      applyToAllPostCaches(qc, postId, (post) => ({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      }))
      toast.success(t("deleteCommentSuccess"))
    },
    onError: (error: Error) => toast.error(error.message),
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
