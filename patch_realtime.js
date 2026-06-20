const fs = require('fs');
const file = 'src/features/posts/hooks/realtime.ts';
let content = fs.readFileSync(file, 'utf8');

const oldHook = `export function useRealtimeEngagement(visiblePostIds: number[]) {
  const qc = useQueryClient()
  const filterKey = useMemo(
    () => Array.from(new Set(visiblePostIds)).sort((a, b) => a - b).join(","),
    [visiblePostIds],
  )
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!filterKey) return

    const scheduleInvalidate = () => {
      if (pendingTimer.current != null) return
      pendingTimer.current = setTimeout(() => {
        pendingTimer.current = null
        qc.invalidateQueries({ queryKey: FEED_QUERY_KEY })
      }, 800)
    }

    const supabase = createBrowserClient()
    const channel = supabase.channel(\`home-feed-engagement-\${filterKey.length}\`)
    for (const table of [
      "post_reactions",
      "post_comments",
      "post_shares",
      "poll_votes",
    ]) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: \`post_id=in.(\${filterKey})\`,
        },
        (payload) => {
          scheduleInvalidate()
          if (table === "post_comments") {
            const row =
              (payload.new as { post_id?: number } | null) ??
              (payload.old as { post_id?: number } | null)
            if (row?.post_id) {
              qc.invalidateQueries({
                queryKey: POST_COMMENTS_KEY(row.post_id),
              })
            }
          }
        },
      )
    }
    channel.subscribe()

    return () => {
      if (pendingTimer.current != null) {
        clearTimeout(pendingTimer.current)
        pendingTimer.current = null
      }
      void supabase.removeChannel(channel)
    }
  }, [filterKey, qc])
}`;

const newHook = `export function useRealtimeEngagement(visiblePostIds: number[]) {
  const qc = useQueryClient()
  // Cap the filter list to prevent string from exceeding Supabase's realtime filter length limit.
  const cappedIds = useMemo(() => {
    const sorted = Array.from(new Set(visiblePostIds)).sort((a, b) => b - a)
    return sorted.slice(0, 50).join(",")
  }, [visiblePostIds])

  useEffect(() => {
    if (!cappedIds) return

    const supabase = createBrowserClient()
    const channel = supabase.channel(\`home-feed-engagement\`)
    for (const table of [
      "post_reactions",
      "post_comments",
      "post_shares",
      "poll_votes",
    ]) {
      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: \`post_id=in.(\${cappedIds})\`,
        },
        (payload) => {
          const row = (payload.new as any) || (payload.old as any)
          if (!row || !row.post_id) return
          const postId = row.post_id

          // O(1) Cache Updates for Feed
          qc.setQueryData<any>(FEED_QUERY_KEY, (oldData: any) => {
            if (!oldData?.pages) return oldData
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                posts: page.posts.map((post: any) => {
                  if (post.id !== postId) return post
                  
                  const p = { ...post }
                  if (table === "post_reactions") {
                    if (payload.eventType === "INSERT") p.reactionCount++
                    else if (payload.eventType === "DELETE") p.reactionCount = Math.max(0, p.reactionCount - 1)
                  } else if (table === "post_comments") {
                    if (payload.eventType === "INSERT") p.commentCount++
                    else if (payload.eventType === "DELETE") p.commentCount = Math.max(0, p.commentCount - 1)
                  } else if (table === "post_shares") {
                    if (payload.eventType === "INSERT") p.shareCount++
                  } else if (table === "poll_votes" && payload.eventType === "INSERT") {
                    if (p.pollOptions && row.option_id) {
                      p.pollOptions = p.pollOptions.map((opt: any) =>
                        opt.id === row.option_id
                          ? { ...opt, voteCount: opt.voteCount + 1 }
                          : opt
                      )
                    }
                  }
                  return p
                }),
              })),
            }
          })

          // Invalidate comments query specifically if it's a comment event
          if (table === "post_comments") {
             qc.invalidateQueries({ queryKey: POST_COMMENTS_KEY(postId) })
          }
        },
      )
    }
    channel.subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [cappedIds, qc])
}`;

content = content.replace(oldHook, newHook);
fs.writeFileSync(file, content);
console.log('Hook updated.');
