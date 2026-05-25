/**
 * One-shot migration: chuyển ảnh post từ bucket `post-media` (layout cũ
 *   `<userId>/<uuid>.<ext>`) sang bucket `uploads` với layout
 *   `post-media/<YYYY>/<MM>/<userId>/<uuid>.<ext>`, rồi cập nhật
 *   `posts.media -> 'url'` cho khớp.
 *
 * Cách chạy:
 *   pnpm dlx tsx scripts/migrate-post-media.ts          # dry-run
 *   pnpm dlx tsx scripts/migrate-post-media.ts --apply  # thực thi
 *   pnpm dlx tsx scripts/migrate-post-media.ts --apply --delete-old
 *
 * Yêu cầu env (đọc từ .env.local nếu chạy local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { createClient } from "@supabase/supabase-js"

loadDotEnvLocal()

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL")
const SERVICE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
const LEGACY_BUCKET = "post-media"
const NEW_BUCKET = "uploads"
const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public`
const LEGACY_PREFIX = `${PUBLIC_BASE}/${LEGACY_BUCKET}/`
const NEW_PREFIX = `${PUBLIC_BASE}/${NEW_BUCKET}/`

const args = new Set(process.argv.slice(2))
const APPLY = args.has("--apply")
const DELETE_OLD = args.has("--delete-old")

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type PostRow = {
  id: number
  created_at: string
  media: { url?: string; type?: string } | null
}

async function main() {
  log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}${DELETE_OLD ? " + delete-old" : ""}`)

  const { data, error } = await admin
    .from("posts")
    .select("id, created_at, media")
    .not("media", "is", null)
    .returns<PostRow[]>()
  if (error) throw error

  const targets = (data ?? []).filter((p) => {
    const url = p.media?.url
    return typeof url === "string" && url.startsWith(LEGACY_PREFIX)
  })

  log(`Found ${targets.length} post(s) with legacy media URL.`)

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const post of targets) {
    const oldUrl = post.media!.url!
    const oldPath = oldUrl.slice(LEGACY_PREFIX.length) // <userId>/<uuid>.<ext>
    const parts = oldPath.split("/")
    if (parts.length !== 2) {
      warn(`#${post.id}: skip — path không khớp layout cũ: ${oldPath}`)
      skipped++
      continue
    }
    const [userId, fileName] = parts
    const d = new Date(post.created_at)
    const yyyy = d.getUTCFullYear().toString()
    const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0")
    const newPath = `post-media/${yyyy}/${mm}/${userId}/${fileName}`
    const newUrl = `${NEW_PREFIX}${newPath}`

    log(`#${post.id}: ${LEGACY_BUCKET}/${oldPath}  →  ${NEW_BUCKET}/${newPath}`)
    if (!APPLY) {
      migrated++
      continue
    }

    try {
      const { data: blob, error: dlErr } = await admin.storage
        .from(LEGACY_BUCKET)
        .download(oldPath)
      if (dlErr || !blob) throw dlErr ?? new Error("empty download")

      const buffer = Buffer.from(await blob.arrayBuffer())
      const contentType = blob.type || guessContentType(fileName)

      const { error: upErr } = await admin.storage
        .from(NEW_BUCKET)
        .upload(newPath, buffer, { contentType, upsert: true })
      if (upErr) throw upErr

      const { error: dbErr } = await admin
        .from("posts")
        .update({
          media: { ...(post.media ?? {}), url: newUrl, type: "image" },
        })
        .eq("id", post.id)
      if (dbErr) throw dbErr

      if (DELETE_OLD) {
        const { error: rmErr } = await admin.storage
          .from(LEGACY_BUCKET)
          .remove([oldPath])
        if (rmErr) warn(`#${post.id}: không xoá được object cũ: ${rmErr.message}`)
      }

      migrated++
    } catch (err) {
      failed++
      warn(`#${post.id}: lỗi — ${(err as Error).message}`)
    }
  }

  log(
    `Done. migrated=${migrated} skipped=${skipped} failed=${failed}` +
      (APPLY ? "" : "  (dry-run, chưa ghi gì)"),
  )
}

function guessContentType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "png":
      return "image/png"
    case "gif":
      return "image/gif"
    case "webp":
      return "image/webp"
    default:
      return "image/jpeg"
  }
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name}`)
  return v
}

function loadDotEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8")
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const [, k, vRaw] = m
      if (process.env[k]) continue
      process.env[k] = vRaw.replace(/^['"]|['"]$/g, "")
    }
  } catch {
    /* ignore — env có thể được cấp sẵn từ shell */
  }
}

function log(msg: string) {
  console.log(`[migrate-post-media] ${msg}`)
}
function warn(msg: string) {
  console.warn(`[migrate-post-media] ${msg}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
