import { listAdminPosts } from "@/features/admin/api/posts"
import { PostsPanel } from "@/features/admin/components/posts-panel"
import {
  ADMIN_POST_STATUSES,
  type AdminPostStatus,
} from "@/features/admin/lib/post-moderation"
import { POST_TYPES, type PostType } from "@/features/posts/lib/constants"

export const dynamic = "force-dynamic"

type PostListStatus = AdminPostStatus | "all"

function asType(v?: string): PostType | "all" | undefined {
  if (!v) return undefined
  if (v === "all" || (POST_TYPES as readonly string[]).includes(v))
    return v as PostType | "all"
  return undefined
}

function asStatus(v?: string): PostListStatus | undefined {
  if (!v) return undefined
  if (v === "all" || (ADMIN_POST_STATUSES as readonly string[]).includes(v))
    return v as PostListStatus
  return undefined
}

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const type = asType(
    typeof params.type === "string" ? params.type : undefined,
  )
  const status = asStatus(
    typeof params.status === "string" ? params.status : undefined,
  )
  const search = typeof params.q === "string" ? params.q : undefined
  const items = await listAdminPosts({
    type: type ?? "all",
    status: status ?? "all",
    search,
    limit: 100,
  })
  return <PostsPanel items={items} query={{ type, status, search }} />
}
