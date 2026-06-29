
<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-FFCA28?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat-square&logo=reactquery" alt="TanStack Query" />
</p>

<h1 align="center">Joblink — Mạng xã hội việc làm & tuyển dụng </h1>

<p align="center">
  <strong>Joblink</strong> là nền tảng kết nối ứng viên và nhà tuyển dụng, tích hợp đầy đủ tính năng mạng xã hội : bài viết, kết nối, nhắn tin, tuyển dụng, và quản trị hệ thống.
</p>

<hr />

## 📋 Mục lục

- [Tổng quan & Công nghệ](#-tổng-quan--công-nghệ)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Tính năng chính](#-tính-năng-chính)
- [Bảo mật](#-bảo-mật)
- [Hiệu suất & Tối ưu](#-hiệu-suất--tối-ưu)
- [Database Schema](#-database-schema)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [API & Server Actions](#-api--server-actions)
- [Đồ án môn học](#-đồ-án-môn-học)

---

## 🛠 Tổng quan & Công nghệ

| Công nghệ | Phiên bản | Vai trò |
|-----------|-----------|---------|
| **Next.js** | 16.2.6 | Framework React full-stack (App Router, RSC, Server Actions) |
| **React** | 19.2.4 | UI library |
| **TypeScript** | ^5 | Ngôn ngữ phát triển |
| **Tailwind CSS** | ^4 | CSS utility framework |
| **shadcn/ui** | Radix UI | Component library |
| **Supabase** | ^2.105.4 | Backend-as-a-Service (Auth, Database, Storage, Realtime) |
| **TanStack Query** | ^5.100 | Quản lý state server & caching |
| **next-intl** | ^4.12 | Đa ngôn ngữ (vi/en) |
| **Zod** | ^4.4 | Schema validation |
| **Framer Motion** | ^12.38 | Animation |
| **react-hook-form** | ^7.76 | Form management |
| **Lucide React** | ^1.16 | Icon library |
| **Sonner** | ^2.0 | Toast notifications |
| **Nodemailer** | ^8.0 | Gửi email server-side |

---

## 🏗 Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐ ┌─────────────┐  │
│  │ Pages/RSC │ │ TanStack │ │  Framer   │ │  next-intl  │  │
│  │           │ │  Query   │ │  Motion   │ │   (vi/en)   │  │
│  └─────┬─────┘ └────┬─────┘ └───────────┘ └─────────────┘  │
│        │            │                                        │
│  ┌─────┴────────────┴────────────────────────────────────┐  │
│  │              Server Actions (API Layer)                │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐  │  │
│  │  │  action/ │ │  parse   │ │require- │ │ unwrap/  │  │  │
│  │  │  result  │ │  (Zod)   │ │  Role   │ │ assertOk │  │  │
│  │  └──────────┘ └──────────┘ └─────────┘ └──────────┘  │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │              Repository Layer (Data)                  │  │
│  │  ┌──────────┐ ┌───────────┐ ┌───────────────────┐   │  │
│  │  │  .repo.ts │ │.privileged│ │  PostgREST / RPC  │   │  │
│  │  └──────────┘ └───────────┘ └───────────────────┘   │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐  │
│  │              Service Layer (Business Logic)           │  │
│  │   post-create, post-engagement, connection, etc.     │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│           Supabase (Backend)                                │
│  ┌────────────┐ ┌──────────────┐ ┌───────────┐ ┌───────┐  │
│  │ PostgreSQL │ │  Auth (JWT)  │ │ Realtime  │ │Storage│  │
│  │ + RLS/RPC  │ │              │ │ (WS)      │ │       │  │
│  └────────────┘ └──────────────┘ └───────────┘ └───────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 Nguyên tắc kiến trúc

| Nguyên tắc | Mô tả |
|------------|-------|
| **Feature-based** | Code được tổ chức theo feature (posts, jobs, network, messaging...) thay vì layer |
| **3-tier Data Access** | Server Action → Repository → Supabase (RPC/RLS) |
| **RSC-first** | Mặc định dùng React Server Components, chỉ dùng "use client" khi cần tương tác |
| **Safe Errors** | Mọi lỗi DB được catch và trả về message an toàn — không rò SQL/stack trace |
| **Zero ORM** | Query trực tiếp Supabase client — gọi RPC cho logic phức tạp |

### Luồng dữ liệu điển hình

```
User click "Đăng bài"
        │
        ▼
PostComposer (client) ──► posts/api/actions.ts (Server Action)
        │                                               │
        │  action("posts")                              │
        │  parse(Zod schema)                            │
        │  requireRole("member")                        │
        │                                               ▼
        │                                   posts/data/posts.repo.ts
        │                                               │
        │                                   supabase.rpc("create_post", ...)
        │                                               │
        │                                   Trả về { ok, data } hoặc { ok, error }
        │                                               │
        │◄──────────────────────────────────────────────┘
        │
        ▼
TanStack Query invalidation → Feed refresh
```

---

## ✨ Tính năng chính

### 🔐 Authentication & Security
- **Đăng ký / Đăng nhập**: Email + password, Google OAuth
- **Quên mật khẩu**: Email reset
- **Kiểm soát phiên**: Middleware chặn user bị ban/suspend
- **Phân quyền**: 3 roles — `member`, `company`, `admin`

### 📝 Posts & Social Feed
| Tính năng | Mô tả |
|-----------|-------|
| **Bài viết đa phương tiện** | Text, image, video, article |
| **Mentions** | @tag người dùng |
| **Link preview** | Tự động fetch metadata |
| **Reactions** | 6 cảm xúc: like, celebrate, support, love, insightful, funny |
| **Comments** | Thread bình luận |
| **Shares** | Chia sẻ bài viết (quote/share) |
| **Visibility** | public / connections / private |

### 💼 Jobs & Tuyển dụng
- **Đăng tin tuyển dụng**: Full-time, part-time, internship, contract, freelance
- **Hình thức làm việc**: On-site, remote, hybrid
- **Ứng tuyển**: Theo dõi trạng thái đơn giản (`submitted`, `withdrawn`, `closed`)
- **Lưu tin**: Saved jobs
- **Quản lý tin tuyển dụng**: Công ty đăng, sửa, lưu nháp và đóng/mở tin

### 🏢 Company Profiles
- Hồ sơ công ty (logo, cover, mô tả, ngành, quy mô, địa chỉ)
- Hệ thống xác minh doanh nghiệp (pending → verified / rejected)
- Trang công khai

### 🤝 Network & Connections
- **Kết nối**: Gửi / chấp nhận / từ chối lời mời
- **Follow/Unfollow**: Theo dõi công ty
- **Suggestions**: Gợi ý kết nối
- **Block**: Chặn người dùng
- **Profile views**: Đếm lượt xem

### 💬 Messaging (Real-time)
- Nhắn tin real-time qua Supabase Realtime (WebSocket)
- Danh sách hội thoại
- Thông báo tin nhắn mới (dock, badge)

### 🔔 Notifications
- Real-time qua Supabase Realtime
- Notification preferences (tắt/bật từng loại)
- Các loại: kết nối, bài viết, bình luận, reactions, tuyển dụng

### 🔍 Search
- Tìm kiếm toàn cục (pg_trgm full-text search)
- Filter: bài viết, người dùng, công ty, công việc

### ⚙️ Settings
- Thông tin tài khoản
- Bảo mật: đổi mật khẩu
- Quyền riêng tư: visibility profile
- Ngôn ngữ: Tiếng Việt / English
- Notification preferences
- Tài khoản bị chặn

### 🛡 Admin Panel (Toàn quyền)
| Module | Chức năng |
|--------|-----------|
| **Dashboard** | Thống kê tổng quan |
| **Users** | Quản lý người dùng, ban/suspend |
| **Companies** | Xác minh / từ chối doanh nghiệp |
| **Posts** | Kiểm duyệt bài viết |
| **Jobs** | Kiểm duyệt tin tuyển dụng |
| **Reports** | Xử lý báo cáo vi phạm |
| **Audit Log** | Nhật ký hành động admin |
| **Roles** | Quản lý vai trò và quyền |

---

## 🔒 Bảo mật

### Lớp bảo vệ

```
Client Input
    │
    ▼
┌──────────────────────────────────────────┐
│  Zod Schema Validation                   │  ← LỚP 1: Validate input
│  parse(schema, formData)                 │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  requireRole / requireCurrentUser        │  ← LỚP 2: Xác thực & phân quyền
│  action wrapper                          │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  ActionError — không rò lỗi DB           │  ← LỚP 3: Error handling an toàn
│  fail("unexpected") thay vì SQL error    │
└──────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────┐
│  Row Level Security (RLS) — Supabase     │  ← LỚP 4: Database-level
│  Policies per table                      │
└──────────────────────────────────────────┘
```

### Chi tiết

1. **Middleware Session Guard** (`src/lib/supabase/middleware.ts`)
   - Refresh session ở đầu mỗi request
   - Kiểm tra user status (banned/suspended) trước khi cho phép truy cập
   - Redirect về login nếu chưa authenticated

2. **Server Action Safety** (`src/lib/action/server.ts`)
   - `action()` wrapper catch mọi exception
   - `ActionError` chỉ expose message an toàn
   - `unwrap()` log lỗi DB ở server nhưng trả `failKey` ra client
   - File `server-only` — không bao giờ chạy ở client

3. **Database RLS** — Mọi bảng đều có Row Level Security:
   - User chỉ xem/sửa dữ liệu thuộc quyền
   - Admin có policies riêng
   - Ví dụ: `posts` — chỉ author mới edit, admin mới xoá

4. **Admin Client** (`src/lib/supabase/admin.ts`)
   - Dùng `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - Service role bypass RLS

5. **Xác thực JWT local**: Dùng `auth.getClaims()` (local) thay vì `getUser()` (network)

6. **Image domain whitelist**: Next.js Image chỉ cho phép Supabase storage domain

7. **Environment validation**: Zod schema kiểm tra env vars khi khởi động

---

## ⚡ Hiệu suất & Tối ưu

### Tối ưu hiệu suất

| Kỹ thuật | Áp dụng |
|----------|---------|
| **React Server Components** | Render HTML ở server, giảm JS bundle |
| **TanStack Query** | Cache 60s, dedupe requests, background refetch |
| **Supabase Realtime** | WebSocket realtime — không polling |
| **Next.js Image** | Tự động tối ưu ảnh, WebP/AVIF, responsive sizes |
| **Image resize client-side** | Ảnh post resize ≤ 1920px trước khi upload |
| **Debounce** | Search input debounce tránh gọi API liên tục |
| **Stagger animations** | Framer Motion stagger children cho feed |
| **PostgreSQL Indexes** | pg_trgm cho full-text search |
| **RPC functions** | Logic phức tạp chạy ở DB — giảm round-trips |
| **Route groups** | Next.js Route Groups cho code splitting |

### Database Performance
- **Extensions**: `pgcrypto`, `pg_trgm`
- **Stored Procedures**: 40+ RPC functions cho logic phức tạp
- **Triggers**: Feed sync, notification fan-out, counter sync
- **Indexes**: Full-text search, foreign keys

---

## 💾 Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    users    │1──N│  posts      │1──N│  comments   │
│             │     │             │     │             │
│ auth_id(PK) │     │ author_id   │     │ post_id     │
│ email       │     │ content     │     │ author_id   │
│ role        │     │ post_type   │     │ content     │
│ status      │     │ media       │     └─────────────┘
│ locale      │     │ visibility  │
│ last_login  │     │ status      │     ┌─────────────┐
└──────┬──────┘     │ reaction_c  │1──N│  reactions  │
       │            │ comment_c   │     │ post_id     │
       │            │ share_c     │     │ user_id     │
       │            └─────────────┘     │ type        │
       │                                └─────────────┘
       │
       │1        ┌──────────────────────┐     ┌─────────────┐
       ├─────────│  member_profiles     │     │  jobs       │
       │         │  full_name, avatar   │     │ company_id  │
       │         │  headline, skills    │     │ title       │
       │         └──────────────────────┘     │ job_type    │
       │                                      │ work_mode   │
       │1        ┌──────────────────────┐     │ location_id │
       └─────────│  company_profiles    │     │ salary_min  │
                 │  name, logo, cover   │     │ salary_max  │
                 │  verification_status │     │ status      │
                 │  industry, size      │     └──────┬──────┘
                 └──────────────────────┘            │
                                                     │
                 ┌──────────────────┐               N│
                 │  applications    │◄────────────────┘
                 │  job_id          │
                 │  applicant_id    │   ┌──────────────────┐
                 │  status          │   │   connections    │
                 │  cv_url          │   │ requester_id     │
                 └──────────────────┘   │ addressee_id     │
                                        │ status           │
┌──────────────┐   ┌────────────────┐   └──────────────────┘
│  messages    │   │ conversations  │
│ conv_id      │   │ participant_1  │   ┌──────────────────┐
│ sender_id    │   │ participant_2  │   │ notifications    │
│ content      │   │ last_message   │   │ user_id          │
│ created_at   │   │ last_time      │   │ type, payload    │
└──────────────┘   └────────────────┘   │ read_at          │
                                         └──────────────────┘
```

> 📐 File ERD: `ERD_Joblink.drawio` | `FULL_ERD_Joblink.drawio` (mở bằng draw.io)

### Bảng chính (40+ tables)

| Bảng | Mục đích |
|------|----------|
| `users` | Người dùng (member/company/admin) |
| `member_profiles` | Hồ sơ thành viên |
| `company_profiles` | Hồ sơ công ty |
| `posts` | Bài viết |
| `post_comments` | Bình luận |
| `post_reactions` | Cảm xúc bài viết |
| `post_shares` | Chia sẻ bài viết |
| `jobs` | Tin tuyển dụng |
| `job_applications` | Đơn ứng tuyển |
| `connections` | Kết nối (pending/accepted/rejected/blocked) |
| `follows` | Follow |
| `user_blocks` | Chặn |
| `conversations` / `messages` | Nhắn tin |
| `notifications` | Thông báo |
| `notification_preferences` | Cài đặt thông báo |
| `reports` | Báo cáo vi phạm |
| `audit_logs` | Nhật ký admin |
| `provinces` / `wards` | Đơn vị hành chính |
| `member_cvs` | CV của member |
| `system_settings` | Cài đặt hệ thống (regional, email, security) |
| `member_skills` | Kỹ năng |
| `saved_jobs` | Việc làm đã lưu |

> 📄 Xem schema đầy đủ: [`schema.sql`](./schema.sql) (hợp nhất đến migration 086)

---

## 📁 Cấu trúc thư mục

```
joblink/
├── .env.example              # Biến môi trường mẫu
├── schema.sql                # Database schema hợp nhất
├── ERD_Joblink.drawio        # ERD diagrams
├── FULL_ERD_Joblink.drawio
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout (i18n, providers, fonts)
│   │   ├── page.tsx          # / → redirect /login
│   │   ├── globals.css       # Tailwind CSS + shadcn/ui vars
│   │   ├── login/            # /login
│   │   ├── register/         # /register
│   │   ├── forgot-password/  # /forgot-password
│   │   ├── auth/callback/    # OAuth callback
│   │   └── (main)/           # Authenticated routes group
│   │       ├── layout.tsx    # Navbar, CurrentUserProvider, Realtime
│   │       ├── home/         # /home — feed
│   │       ├── profile/      # /profile/[id], /profile/edit
│   │       ├── jobs/         # /jobs, /jobs/[id], /jobs/applications
│   │       ├── company/      # /company/[id], /company/post-job
│   │       ├── network/      # /network
│   │       ├── messages/     # /messages
│   │       ├── notifications/# /notifications
│   │       ├── search/       # /search
│   │       ├── saved-jobs/   # /saved-jobs
│   │       ├── settings/     # /settings
│   │       └── admin/        # /admin/dashboard, users, companies, posts, jobs, reports, roles, audit-log
│   │
│   ├── features/             # Feature modules
│   │   ├── auth/             # Authentication (login, register, OAuth)
│   │   ├── posts/            # Posts, feed, comments, reactions, shares
│   │   ├── jobs/             # Job management, applications
│   │   ├── companies/        # Company profiles, verification
│   │   ├── network/          # Connections, follows, blocks, suggestions
│   │   ├── messaging/        # Real-time chat
│   │   ├── notifications/    # Real-time notifications
│   │   ├── search/           # Full-text search
│   │   ├── settings/         # User settings
│   │   ├── reports/          # Report system
│   │   ├── admin/            # Admin panel services
│   │   └── system-settings/  # System settings
│   │
│   ├── components/           # Shared components
│   │   ├── ui/               # shadcn/ui components (Radix-based)
│   │   ├── navbar.tsx
│   │   ├── logo.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── language-switcher.tsx
│   │   ├── profile-dropdown.tsx
│   │   ├── message-dropdown.tsx
│   │   └── notification-dropdown.tsx
│   │
│   ├── lib/                  # Shared utilities
│   │   ├── supabase/         # Client (browser, server, admin, middleware)
│   │   ├── action/           # Server action utilities (action, result, rpc)
│   │   ├── utils/            # Format, debounce, relative time, profile URL
│   │   ├── constants.ts      # Domain constants (roles, statuses, types)
│   │   ├── animations.ts     # Framer Motion variants
│   │   ├── query-client.ts   # TanStack Query client factory
│   │   └── utils.ts          # cn() — tailwind-merge
│   │
│   ├── providers/            # React providers
│   │   ├── index.tsx         # ThemeProvider + QueryProvider + TooltipProvider + Toaster
│   │   └── query-provider.tsx
│   │
│   ├── config/               # Config
│   │   ├── env.ts            # Zod-validated environment variables
│   │   └── site.ts           # Site configuration
│   │
│   ├── i18n/                 # Internationalization
│   │   ├── config.ts         # Locale config (vi/en)
│   │   ├── request.ts        # next-intl request config
│   │   └── actions.ts        # Locale switch action
│   │
│   └── types/                # Shared types
│       └── database.ts       # Database row types (1053 lines)
│
├── supabase/
│   ├── migrations/           # 66+ SQL migration files
│   ├── reset_public_schema.sql
│   └── seed.sql
│
├── messages/                 # i18n translation files
│   ├── vi.json               # Tiếng Việt
│   └── en.json               # English
│
├── scripts/                  # Utility scripts
│   └── migrate-post-media.ts
│
├── public/                   # Static assets
├── proxy.ts                  # Middleware (auth session guard)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Hướng dẫn cài đặt

### Yêu cầu

- Node.js ≥ 18
- npm / pnpm / yarn
- Supabase project (tạo tại [supabase.com](https://supabase.com))

### Bước 1: Clone & cài đặt

```bash
git clone <repo-url>
cd joblink

# Cài dependencies
npm install
# hoặc
pnpm install
```

### Bước 2: Cấu hình biến môi trường

```bash
cp .env.example .env.local
```

Điền các giá trị từ Supabase project dashboard:

| Biến | Mô tả | Nguồn |
|------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | Supabase Dashboard → Settings → API |

### Bước 3: Database Migration

Chạy file schema tổng hợp:

```bash
# Cách 1: Dùng Supabase CLI
supabase db push

# Cách 2: Copy nội dung schema.sql vào Supabase SQL Editor
# Mở schema.sql → Copy → Paste vào Supabase Dashboard → SQL Editor → Run
```

### Bước 4: Storage Buckets

Tạo các storage buckets trong Supabase Dashboard:
- `uploads` — ảnh/video bài viết
- `avatars` — ảnh đại diện
- `covers` — ảnh bìa
- `cvs` — CV ứng viên

### Bước 5: Chạy development

```bash
npm run dev
# Mở http://localhost:3000
```

### Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production |
| `npm run lint` | ESLint kiểm tra code |

---

## 🌐 API & Server Actions

Joblink không dùng REST API truyền thống mà dùng **Next.js Server Actions**:

```typescript
// Mỗi action đều được bọc bởi action() wrapper:
const result = await action("posts", async (t) => {
  const input = parse(createPostSchema, formData)
  const user = await requireRole("member")
  const post = await postsRepo.create(user.appUser.id, input)
  return post
})

// Client nhận ActionResult:
if (result.ok) {
  toast.success("Đăng bài thành công!")
} else {
  toast.error(result.error) // Message an toàn, đã dịch
}
```

**Chain bảo vệ**: `action()` → `requireRole()` → `parse(Zod)` → `unwrap(supabase)`

---

## 🎓 Đồ án môn học

**Môn học**: SE005 — Giới thiệu ngành Kỹ thuật Phần mềm

**Đề tài**: Xây dựng mạng xã hội việc làm và tuyển dụng 

**Công nghệ sử dụng**:
- Web Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS
- UI Components: shadcn/ui (Radix UI) + Framer Motion + Lucide Icons
- Backend & Database: Supabase (PostgreSQL + Auth + Realtime + Storage)
- State Management: TanStack React Query 5
- Validation: Zod 4 + react-hook-form
- Đa ngôn ngữ: next-intl (tiếng Việt / English)
- Gửi Email: Nodemailer

---

<p align="center">
  <sub>Built with Team 18NĐ</sub>
</p>
