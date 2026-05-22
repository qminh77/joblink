"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  Flag,
  Globe,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { btnTap, fadeUp } from "@/lib/animations"
import { formatRelativeTime, getInitials } from "@/lib/utils/format"
import { useCurrentUser } from "@/features/auth/components/current-user-provider"
import { ReportDialog } from "@/features/reports/components/report-dialog"

import { useCreateComment, useDeletePost, useToggleReaction } from "../hooks"
import type { FeedPost } from "../types"
import { CommentsThread } from "./comments-thread"
import { ImageLightbox } from "@/components/ui/image-lightbox"
import { PostComposer } from "./post-composer"

type Props = {
  post: FeedPost
  onShare: (post: FeedPost) => void
  onSend: (post: FeedPost) => void
}

const dropdownItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

function visibilityIcon(v: FeedPost["visibility"]) {
  if (v === "private") return <Lock className="w-3 h-3" />
  if (v === "connections") return <Users className="w-3 h-3" />
  return <Globe className="w-3 h-3" />
}

export function PostCard({ post, onShare, onSend }: Props) {
  const tFeed = useTranslations("feed")
  const tPosts = useTranslations("posts")
  const user = useCurrentUser()
  const userInitials = getInitials(user.displayName, "JL")

  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [showReport, setShowReport] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const toggle = useToggleReaction()
  const createComment = useCreateComment()
  const deletePost = useDeletePost()

  const isOwnPost = user.id === post.authorId
  const authorInitials = getInitials(post.author.displayName, "JL")

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    const text = comment.trim()
    if (!text) return
    setComment("")
    createComment.mutate({ postId: post.id, content: text })
  }

  return (
    <motion.div variants={fadeUp}>
      <Card className="bg-card border-border/40 rounded-2xl overflow-hidden p-0 gap-0">
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.authorId}`}>
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/40 hover:opacity-80 transition-opacity">
                  {post.author.avatarUrl ? (
                    <AvatarImage src={post.author.avatarUrl} />
                  ) : null}
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  href={`/profile/${post.authorId}`}
                  className="font-headline font-bold text-foreground text-[13px] sm:text-sm hover:text-primary transition-colors leading-none mb-1 block"
                >
                  {post.author.displayName}
                </Link>
                {post.author.headline ? (
                  <p className="text-[11px] sm:text-xs text-muted-foreground leading-none">
                    {post.author.headline}
                  </p>
                ) : null}
                <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center mt-1">
                  {formatRelativeTime(post.createdAt)}{" "}
                  <span className="mx-1">•</span>{" "}
                  {visibilityIcon(post.visibility)}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="w-64 p-1.5 rounded-2xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/10 dark:shadow-black/40"
              >
                {isOwnPost ? (
                  <motion.div
                    variants={dropdownItemVariants}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: 0.04 }}
                  >
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        setShowEdit(true)
                      }}
                      className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                    >
                      <Pencil className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {tPosts("editPost")}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {tPosts("editPostHint")}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </motion.div>
                ) : null}
                {isOwnPost ? (
                  <motion.div
                    variants={dropdownItemVariants}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: 0.05 }}
                  >
                    <DropdownMenuItem
                      onSelect={(event) => {
                        event.preventDefault()
                        setShowDelete(true)
                      }}
                      disabled={deletePost.isPending}
                      className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                    >
                      <Trash2 className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {tPosts("deletePost")}
                        </span>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {tPosts("deletePostHint")}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  </motion.div>
                ) : null}
                {isOwnPost ? (
                  <DropdownMenuSeparator className="my-1 bg-border/20" />
                ) : null}
                <motion.div
                  variants={dropdownItemVariants}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: 0.08 }}
                >
                  <DropdownMenuItem
                    onClick={() => setShowReport(true)}
                    className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
                  >
                    <Flag className="w-4.5 h-4.5 text-muted-foreground mr-3 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {tPosts("reportPost")}
                      </span>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {tPosts("reportPostHint")}
                      </p>
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 text-[13px] sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line font-body">
            {post.content}
          </div>

          {post.media && typeof post.media === "object" && "url" in post.media ? (
            <div className="mt-3 -mx-4 sm:-mx-0 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-border/30 bg-muted/10">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => setLightboxUrl((post.media as { url: string }).url)}
              >
                <img
                  src={(post.media as { url: string }).url}
                  alt="Post media"
                  className="w-full max-h-96 object-contain"
                />
              </button>
            </div>
          ) : null}
        </div>

        <div className="px-3 sm:px-4 py-3 border-b border-t border-border/30 flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="bg-blue-500 rounded-full p-0.5 flex items-center justify-center">
              <ThumbsUp className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="ml-1 text-foreground/80 font-medium">
              {post.reactionCount}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="hover:text-primary transition-colors"
              onClick={() => setOpen((v) => !v)}
            >
              {tFeed("commentsCount", { count: post.commentCount })}
            </button>
            <button
              type="button"
              className="hover:text-primary transition-colors"
              onClick={() => onShare(post)}
            >
              {tFeed("sharesCount", { count: post.shareCount })}
            </button>
          </div>
        </div>

        <div className="px-1 sm:px-2 py-1 flex items-center justify-between">
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => toggle.mutate(post.id)}
            disabled={toggle.isPending}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg transition-colors font-semibold text-[11px] sm:text-[13px] ${
              post.viewerReacted
                ? "text-primary hover:bg-primary/10"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <ThumbsUp
              className={`w-4 h-4 ${post.viewerReacted ? "fill-primary" : ""}`}
            />
            <span className="hidden sm:inline">{tFeed("like")}</span>
          </motion.button>
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{tFeed("comment")}</span>
          </motion.button>
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => onShare(post)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{tFeed("share")}</span>
          </motion.button>
          <motion.button
            {...btnTap}
            type="button"
            onClick={() => onSend(post)}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors font-semibold text-[11px] sm:text-[13px]"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{tFeed("send")}</span>
          </motion.button>
        </div>

        {open ? (
          <div className="p-4 bg-muted/10 border-t border-border/30 space-y-3">
            <form onSubmit={submitComment} className="flex gap-3">
              <Avatar className="w-8 h-8">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} /> : null}
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center gap-1.5">
                <Input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={tFeed("writeComment")}
                  className="h-9 rounded-full text-[13px]"
                />
                <Button
                  type="submit"
                  size="icon-sm"
                  variant="ghost"
                  disabled={!comment.trim() || createComment.isPending}
                  aria-label={tFeed("send")}
                  className="text-primary shrink-0"
                >
                  <Send />
                </Button>
              </div>
            </form>
            <CommentsThread postId={post.id} enabled={open} />
          </div>
        ) : null}
      </Card>

      <PostComposer
        open={showEdit}
        onClose={() => setShowEdit(false)}
        post={post}
      />

      <ReportDialog
        open={showReport}
        onClose={() => setShowReport(false)}
        targetType="post"
        targetId={post.id}
      />

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tPosts("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tPosts("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePost.isPending}>
              {tPosts("deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePost.isPending}
              onClick={() => {
                deletePost.mutate(post.id)
                setShowDelete(false)
              }}
            >
              {tPosts("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lightboxUrl ? (
        <ImageLightbox
          src={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      ) : null}
    </motion.div>
  )
}
