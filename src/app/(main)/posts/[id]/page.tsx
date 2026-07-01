import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { loadSinglePost } from "@/features/posts/api/queries"
import { PostDetailView } from "@/features/posts/components/post-detail-view"
import { requireCurrentUser } from "@/features/auth/api/auth-server"

type Props = {
  params: Promise<{ id: string }>
}

export default async function PostPage({ params }: Props) {
  const rawId = (await params).id
  const postId = Number.parseInt(rawId, 10)
  if (!Number.isFinite(postId) || postId <= 0) notFound()

  await requireCurrentUser()
  const post = await loadSinglePost(postId)
  if (!post) notFound()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Link href="/home">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>
      <PostDetailView post={post} />
    </div>
  )
}
