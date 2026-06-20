"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  Flag,
  Globe,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInitials } from "@/lib/utils/format"
import { profileHref } from "@/lib/utils/profile-url"
import { useRelativeTime } from "@/lib/utils/use-relative-time"

import type { FeedPost } from "../../types"

const dropdownItemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
}

function VisibilityIcon({ visibility }: { visibility: FeedPost["visibility"] }) {
  if (visibility === "private") return <Lock className="w-3 h-3" />
  if (visibility === "connections") return <Users className="w-3 h-3" />
  return <Globe className="w-3 h-3" />
}

export function PostCardHeader({
  deletePending,
  isOwnPost,
  onDelete,
  onEdit,
  onReport,
  post,
}: {
  deletePending: boolean
  isOwnPost: boolean
  onDelete: () => void
  onEdit: () => void
  onReport: () => void
  post: FeedPost
}) {
  const tPosts = useTranslations("posts")
  const authorInitials = getInitials(post.author.displayName, "JL")
  const createdRel = useRelativeTime(post.createdAt)

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Link href={profileHref(post.authorId, post.author.role)}>
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-border/40 hover:opacity-80 transition-opacity">
            {post.author.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} />
            ) : null}
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link
            href={profileHref(post.authorId, post.author.role)}
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
            {createdRel} <span className="mx-1">•</span>{" "}
            <VisibilityIcon visibility={post.visibility} />
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
                  onEdit()
                }}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <Pencil className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
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
                  onDelete()
                }}
                disabled={deletePending}
                className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
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
              onSelect={(event) => {
                event.preventDefault()
                onReport()
              }}
              className="cursor-pointer rounded-xl py-2.5 px-3 transition-all focus:bg-muted"
            >
              <Flag className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
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
  )
}
