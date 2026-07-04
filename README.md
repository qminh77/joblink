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
  <strong>Joblink</strong> là nền tảng kết nối ứng viên và nhà tuyển dụng, tích hợp đầy đủ tính năng mạng xã hội: bài viết, kết nối, nhắn tin, tuyển dụng, và quản trị hệ thống.
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
- [Hướng dẫn cài đặt & Chạy dự án (Local & Prod)](#-hướng-dẫn-cài-đặt--chạy-dự-án)
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
| **TanStack Query** | ^5.100.10 | Quản lý state server & caching |
| **next-intl** | ^4.12.0 | Đa ngôn ngữ (vi/en) |
| **Zod** | ^4.4.3 | Schema validation |
| **Framer Motion** | ^12.38.0 | Animation |
| **react-hook-form** | ^7.76.0 | Form management |
| **Lucide React** | ^1.16.0 | Icon library |
| **Sonner** | ^2.0.7 | Toast notifications |
| **Nodemailer** | ^8.0.8 | Gửi email server-side |

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
| **Feature-based** | Code được tổ chức theo module tính năng (posts, jobs, network, messaging...) thay vì layer |
| **3-tier Data Access** | Server Action → Repository → Supabase (RPC/RLS) |
| **RSC-first** | Mặc định dùng React Server Components, chỉ dùng "use client" khi cần tương tác |
| **Safe Errors** | Mọi lỗi DB được catch và trả về message an toàn — không rò rỉ SQL/stack trace |
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
- **Đăng ký / Đăng nhập**: Email + password, Google OAuth.
- **Quên mật khẩu**: Email reset.
- **Kiểm soát phiên**: Middleware chặn user bị ban/suspend.
- **Phân quyền**: 3 roles — `member`, `company`, `admin`.

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
- **Lưu tin**: Saved jobs dành cho ứng viên
- **Quản lý tin tuyển dụng**: Công ty đăng, sửa, lưu nháp và đóng/mở tin

### 🏢 Company Profiles & CVs
- Hồ sơ công ty (logo, cover, mô tả, ngành, quy mô, địa chỉ).
- Quản lý và uỷ quyền xác minh doanh nghiệp (pending → verified / rejected).
- **CVs**: Hệ thống quản lý CV ứng viên.

### 🤝 Network & Connections
- **Kết nối**: Gửi / chấp nhận / từ chối lời mời.
- **Follow/Unfollow**: Theo dõi công ty.
- **Block & Suggestions**: Chặn người dùng, gợi ý kết nối.
- **Profile views**: Đếm lượt xem

### 💬 Messaging (Real-time)
- Nhắn tin real-time qua Supabase Realtime (WebSocket).
- Danh sách hội thoại và thông báo tin nhắn mới (dock, badge).

### 🔔 Notifications
- Real-time qua Supabase Realtime
- Notification preferences (tắt/bật từng loại)
- Các loại: kết nối, bài viết, bình luận, reactions, tuyển dụng

### 🔍 Search
- Tìm kiếm toàn cục mạnh mẽ bằng `pg_trgm` full-text search trên PostgreSQL.
- Filter: bài viết, người dùng, công ty, công việc.

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

Hệ thống được bảo vệ qua nhiều lớp:

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

1. **Zod Validation**: Lớp 1 - Xác thực chặt chẽ đầu vào.
2. **Server Actions Guard**: Lớp 2 - Yêu cầu quyền (Role) thông qua middleware và higher-order functions.
3. **ActionError**: Lớp 3 - Bọc lỗi Database và trả về `failKey` an toàn, không rò rỉ thông tin nội bộ.
4. **Supabase RLS (Row Level Security)**: Lớp 4 - Chỉ chủ sở hữu mới có quyền thao tác trên dữ liệu của mình ở cấp độ Database.
5. **Session Guard**: Middleware tự động chặn session nếu tài khoản bị khoá (banned/suspended).

---

## ⚡ Hiệu suất & Tối ưu

- **React Server Components**: Tối ưu bundle size client.
- **TanStack Query**: Cache 60s, dedupe requests, background refetch.
- **Supabase Realtime**: WebSocket realtime — không polling.
- **Next.js Image**: Tự động tối ưu ảnh, WebP/AVIF, responsive sizes.
- **Debounce**: Search input debounce tránh spam API.
- **PostgreSQL Indexes**: `pg_trgm` cho tìm kiếm cực nhanh.
- **RPC functions**: Logic phức tạp chạy ở DB — giảm round-trips.

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

### Bảng chính (40+ tables)

| Module | Bảng | Mục đích |
|--------|------|----------|
| **Core** | `users`, `system_settings`, `audit_logs` | Quản lý người dùng, cài đặt hệ thống, log admin |
| **Profiles** | `member_profiles`, `company_profiles`, `member_skills`, `member_cvs` | Thông tin người dùng & doanh nghiệp, CV |
| **Social** | `posts`, `post_comments`, `post_reactions`, `post_shares` | Mạng xã hội, bài đăng |
| **Jobs** | `jobs`, `job_applications`, `saved_jobs` | Tuyển dụng & ứng tuyển |
| **Network** | `connections`, `follows`, `user_blocks` | Kết nối, theo dõi |
| **Chat** | `conversations`, `messages`, `conversation_participants` | Tin nhắn thời gian thực |
| **Notify** | `notifications`, `notification_preferences` | Hệ thống báo sự kiện |
| **Địa lý** | `provinces`, `wards` | Dữ liệu địa phương, hành chính |

> 📄 Tham khảo schema đầy đủ tại: [`schema.sql`](./schema.sql)

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
│   ├── app/                  # Next.js App Router (Pages, Layouts)
│   ├── features/             # Các module tính năng (Feature-based)
│   │   ├── admin/            # Quản trị hệ thống
│   │   ├── auth/             # Xác thực (Đăng nhập, đăng ký)
│   │   ├── companies/        # Hồ sơ công ty
│   │   ├── cvs/              # Quản lý CV
│   │   ├── jobs/             # Tuyển dụng và việc làm
│   │   ├── locations/        # Dữ liệu vị trí (Provinces/Wards)
│   │   ├── messaging/        # Chat & Nhắn tin realtime
│   │   ├── network/          # Mạng lưới kết nối
│   │   ├── notifications/    # Thông báo hệ thống
│   │   ├── posts/            # Bài viết, News feed
│   │   ├── profile/          # Hồ sơ cá nhân
│   │   ├── reports/          # Báo cáo vi phạm
│   │   ├── search/           # Tìm kiếm tổng hợp
│   │   └── settings/         # Cài đặt người dùng
│   │
│   ├── components/           # UI Components chia sẻ (shadcn/ui, layout)
│   ├── lib/                  # Utilities (Supabase client, actions, utils, animations)
│   ├── providers/            # React Context Providers
│   ├── config/               # Cấu hình site, môi trường (Zod Env)
│   ├── i18n/                 # Đa ngôn ngữ (next-intl)
│   └── types/                # TypeScript interfaces (database.ts)
│
├── supabase/
│   ├── migrations/           # File SQL tạo bảng, RLS
│   └── seed.sql              # Dữ liệu mẫu (nếu có)
├── messages/                 # Dữ liệu i18n (vi.json, en.json)
├── public/                   # Static assets
└── package.json
```

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

Dự án hỗ trợ 2 chế độ Backend: **Production (Cloud)** và **Local (Docker)**. Khuyên dùng **Supabase Local** để lập trình và test, tránh tác động tới DB thật.

### Yêu cầu
- Node.js ≥ 18
- `npm`, `yarn`, hoặc `pnpm`
- **Docker** (Khuyên dùng [OrbStack](https://orbstack.dev/) cho MacOS thay vì Docker Desktop).

### 1. Clone & Cài đặt thư viện

```bash
git clone <repo-url>
cd joblink
npm install
```

### 2. Thiết lập Môi trường (Local Supabase - Khuyên Dùng)

**Bước 1: Cài đặt Supabase CLI**
- Mac (Homebrew): `brew install supabase/tap/supabase`
- Windows/Linux: Xem tại [Tài liệu Supabase CLI](https://supabase.com/docs/guides/cli/getting-started).

**Bước 2: Khởi động Supabase Local**
Chắc chắn Docker / OrbStack đang chạy, gõ:
```bash
supabase start
```

**Bước 3: Nạp cấu trúc Database (Schema)**
File `schema.sql` sẽ tự động thiết lập toàn bộ cấu trúc bảng:
```bash
supabase db reset
```

**Bước 4: Cấu hình biến môi trường (`.env.local`)**
```bash
cp .env.example .env.local
```
Điền thông tin lấy từ terminal sau khi chạy `supabase start`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
> **Mẹo:** Vào `http://127.0.0.1:54323` để mở Supabase Studio quản lý database trực quan.

---

### 3. Đồng bộ Dữ liệu từ Production về Local (Tuỳ chọn)

Nếu bạn muốn có dữ liệu thật (Prod) trên máy Local để test:

1. **Dump dữ liệu từ Prod:**
   ```bash
   # Tải dữ liệu các bảng public
   supabase db dump --db-url "postgresql://postgres.[project-ref]:[DB_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" --data-only --disable-triggers -n public > data.sql
   
   # Tải danh sách tài khoản auth (để đăng nhập được)
   supabase db dump --db-url "postgresql://postgres.[project-ref]:[DB_PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres" --data-only --disable-triggers -t auth.users -t auth.identities > auth_data.sql
   ```

2. **Nạp dữ liệu vào Local (Sử dụng quyền supabase_admin):**
   ```bash
   docker exec -i supabase_db_joblink psql -U supabase_admin -d postgres < data.sql
   docker exec -i supabase_db_joblink psql -U supabase_admin -d postgres < auth_data.sql
   ```

---

### 4. Chạy Frontend (Next.js)

```bash
npm run dev
# Truy cập http://localhost:3000
```

### Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production |
| `npm run lint` | ESLint kiểm tra code |
| `npm run test` | Chạy Vitest |

---

## 🌐 API & Server Actions

Joblink sử dụng **Next.js Server Actions** một cách an toàn và nhất quán:

```typescript
// Mọi action đều được bọc bởi action() wrapper an toàn:
const result = await action("posts", async (t) => {
  const input = parse(createPostSchema, formData)
  const user = await requireRole("member")
  const post = await postsRepo.create(user.appUser.id, input)
  return post
})

// Client sử dụng:
if (result.ok) {
  toast.success("Đăng bài thành công!")
} else {
  toast.error(result.error) // Lỗi đã được catch và dịch an toàn
}
```

---

## 🎓 Đồ án môn học

**Môn học**: SE005 — Giới thiệu ngành Kỹ thuật Phần mềm

**Đề tài**: Xây dựng mạng xã hội việc làm và tuyển dụng 

**Công nghệ sử dụng**:
- Web Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- UI Components: shadcn/ui (Radix UI) + Framer Motion + Lucide Icons
- Backend & Database: Supabase (PostgreSQL + Auth + Realtime + Storage)
- State Management: TanStack React Query 5
- Validation: Zod 4 + react-hook-form
- Đa ngôn ngữ: next-intl (vi / en)
- Gửi Email: Nodemailer

---

<p align="center">
  <sub>Built with Team 18NĐ</sub>
</p>
