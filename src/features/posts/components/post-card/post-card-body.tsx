"use client"

import type { MediaItem } from "../../lib/media"
import { readSharedOriginal, readVideoUrl } from "../../lib/media"
import type { FeedPost } from "../../types"
import { PollView } from "../poll-view"
import { PostMediaView } from "../post-media-view"
import { SharedPostQuote } from "../shared-post-quote"

export function PostCardBody({
  onOpenLightbox,
  post,
}: {
  onOpenLightbox: (items: MediaItem[], index: number) => void
  post: FeedPost
}) {
  const sharedOriginal = readSharedOriginal(post.media)
  const videoUrl = readVideoUrl(post.media)
  const isSharedPost = sharedOriginal != null

  return (
    <>
      {post.content ? (
        <div className="mt-4 text-[13px] sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-body">
          {post.content}
        </div>
      ) : null}

      {post.postType === "poll" ? (
        <PollView post={post} />
      ) : isSharedPost ? (
        <SharedPostQuote media={post.media} onOpenLightbox={onOpenLightbox} />
      ) : videoUrl ? (
        <div className="mt-4 rounded-xl overflow-hidden bg-black">
          <video src={videoUrl} controls className="w-full max-h-[32rem]" />
        </div>
      ) : (
        <PostMediaView media={post.media} onOpen={onOpenLightbox} />
      )}
    </>
  )
}
