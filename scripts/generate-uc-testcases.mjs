import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = dirname(fileURLToPath(import.meta.url))

const moduleDefaults = {
  M01: {
    route: "/login|/register|/forgot-password|/auth/callback",
    codeEntry: "src/features/auth/api/auth-actions.ts",
    flow: [
      "public auth route",
      "auth component/hook",
      "auth action/client",
      "Supabase Auth",
      "public.users mirror",
    ],
  },
  M02: {
    route: "/profile/[id]|/profile/edit",
    codeEntry: "src/features/profile/api/actions.ts",
    flow: [
      "profile route",
      "profile component/hook",
      "profile or CV action/query",
      "profile service/repo",
      "Supabase tables/storage",
    ],
  },
  M03: {
    route: "/company/[id]|/settings",
    codeEntry: "src/features/companies/api/actions.ts",
    flow: [
      "company route/settings tab",
      "company component/hook",
      "company action/query",
      "company service/RPC",
      "company_profiles/follows",
    ],
  },
  M04: {
    route: "/home|/posts/[id]",
    codeEntry: "src/features/posts/api/actions.ts",
    flow: [
      "feed/post route",
      "post component/hook",
      "post action/query",
      "post service/repo/RPC",
      "posts/comments/reactions/shares",
    ],
  },
  M05: {
    route: "/network|/search|/profile/[id]",
    codeEntry: "src/features/network/api/actions.ts",
    flow: [
      "network/search/profile UI",
      "network/search hooks",
      "network/search action",
      "service/repository/RPC",
      "connections/follows/blocks/search data",
    ],
  },
  M06: {
    route: "/jobs|/jobs/[id]|/saved-jobs|/jobs/applications|/company/post-job",
    codeEntry: "src/features/jobs/api/actions.ts",
    flow: [
      "jobs route",
      "jobs component/hook",
      "jobs action/query",
      "jobs service/policy",
      "jobs/applications/saved_jobs + notifications",
    ],
  },
  M07: {
    route: "/messages|/notifications|/settings",
    codeEntry: "src/features/messaging/api/actions.ts",
    flow: [
      "messages/notifications UI",
      "TanStack Query hook",
      "messaging/notification action",
      "service/repository/RPC",
      "realtime/cache update",
    ],
  },
  M08: {
    route: "/settings|report dialog",
    codeEntry: "src/features/settings/api/actions.ts",
    flow: [
      "settings/report UI",
      "settings/report hook",
      "settings/report action",
      "service/repository",
      "users/preferences/reports",
    ],
  },
  M09: {
    route: "/admin/*",
    codeEntry: "src/features/admin/api/dashboard.ts",
    flow: [
      "admin route",
      "admin panel",
      "admin API",
      "admin service/repo",
      "audit/revalidation",
    ],
  },
}

const ucList = [
  ["UC-01", "M01", "Dang ky tai khoan ca nhan", "Khach", "High", "src/features/auth/api/auth-actions.ts", "/register", ["fullName", "email", "password", "termsAccepted"]],
  ["UC-02", "M01", "Dang ky tai khoan cong ty", "Khach", "High", "src/features/auth/api/auth-actions.ts", "/register", ["companyName", "taxId", "representativeName", "email", "password", "termsAccepted"]],
  ["UC-03", "M01", "Xac minh email dang ky", "Khach, Dich vu Email", "High", "src/app/auth/callback/route.ts", "/auth/callback", ["code"]],
  ["UC-04", "M01", "Dang nhap bang email va mat khau", "Khach", "High", "src/features/auth/hooks/use-login.ts", "/login", ["email", "password"]],
  ["UC-05", "M01", "Dang nhap bang Google", "Khach, Google OAuth", "Medium", "src/features/auth/components/google-sign-in-button.tsx", "/login", ["provider", "redirectTo"]],
  ["UC-06", "M01", "Kiem tra dieu kien truy cap tai khoan", "Tac vu tu dong", "High", "src/features/auth/api/auth-server.ts", "protected routes", ["authSession", "userStatus", "role"]],
  ["UC-07", "M01", "Gui yeu cau dat lai mat khau", "Khach, Dich vu Email", "High", "src/features/auth/api/auth-actions.ts", "/forgot-password", ["email"]],
  ["UC-08", "M01", "Dang xuat khoi he thong", "Nguoi dung", "High", "src/features/auth/api/auth-client.ts", "profile menu", ["session"]],
  ["UC-09", "M02", "Cap nhat ho so ca nhan", "Thanh vien", "High", "src/features/profile/api/actions.ts", "/profile/edit", ["fullName", "headline", "about", "visibility"]],
  ["UC-10", "M02", "Cap nhat anh ca nhan", "Thanh vien", "Medium", "src/features/profile/api/actions.ts", "/profile/edit", ["avatarFile", "coverFile"]],
  ["UC-11", "M02", "Quan ly kinh nghiem lam viec", "Thanh vien", "High", "src/features/profile/api/actions.ts", "/profile/edit", ["companyName", "position", "startDate"]],
  ["UC-12", "M02", "Quan ly hoc van", "Thanh vien", "High", "src/features/profile/api/actions.ts", "/profile/edit", ["schoolName", "degree", "fieldOfStudy"]],
  ["UC-13", "M02", "Quan ly ky nang nghe nghiep", "Thanh vien", "High", "src/features/profile/api/actions.ts", "/profile/edit", ["skillName"]],
  ["UC-14", "M02", "Xem ho so nguoi dung", "Nguoi dung", "High", "src/features/profile/api/queries.ts", "/profile/[id]", ["profileUserId"]],
  ["UC-15", "M02", "Xem thong ke ho so ca nhan", "Thanh vien", "Medium", "src/features/profile/api/actions.ts", "/profile/edit", ["targetUserId"]],
  ["UC-16", "M02", "Tai CV len", "Thanh vien", "High", "src/features/cvs/api/actions.ts", "/profile/edit", ["file", "fileName", "storagePath"]],
  ["UC-17", "M02", "Tao CV tu ho so", "Thanh vien", "Medium", "src/features/cvs/api/actions.ts", "/profile/edit", ["profileData", "builderConfig"]],
  ["UC-18", "M02", "Quan ly CV da luu", "Thanh vien", "High", "src/features/cvs/api/actions.ts", "/profile/edit", ["cvId"]],
  ["UC-19", "M02", "Dat CV mac dinh", "Thanh vien", "High", "src/features/cvs/api/actions.ts", "/profile/edit", ["cvId"]],
  ["UC-20", "M03", "Cap nhat ho so cong ty", "Cong ty", "High", "src/features/companies/api/actions.ts", "/settings", ["companyName", "industry", "taxId"]],
  ["UC-21", "M03", "Cap nhat hinh anh cong ty", "Cong ty", "Medium", "src/features/companies/api/actions.ts", "/settings", ["logoFile", "coverFile"]],
  ["UC-22", "M03", "Cap nhat trang thai dang tuyen dung", "Cong ty", "Medium", "src/features/companies/api/actions.ts", "/settings", ["openToHire"]],
  ["UC-23", "M03", "Gui lai yeu cau xac minh cong ty", "Cong ty", "High", "src/features/companies/api/actions.ts", "/settings", ["verificationStatus"]],
  ["UC-24", "M03", "Xem trang cong ty", "Nguoi dung", "High", "src/features/companies/api/queries.ts", "/company/[id]", ["companyUserId"]],
  ["UC-25", "M03", "Theo doi hoac bo theo doi cong ty", "Nguoi dung", "Medium", "src/features/companies/api/actions.ts", "/company/[id]", ["companyUserId"]],
  ["UC-26", "M04", "Xem bang tin", "Nguoi dung", "High", "src/features/posts/api/queries.ts", "/home", ["cursor"]],
  ["UC-27", "M04", "Dang bai viet", "Nguoi dung", "High", "src/features/posts/api/actions.ts", "/home", ["contentOrMedia", "visibility"]],
  ["UC-28", "M04", "Sua hoac xoa bai viet", "Nguoi dung", "High", "src/features/posts/api/actions.ts", "/home", ["postId"]],
  ["UC-29", "M04", "Tuong tac cam xuc bai viet", "Nguoi dung", "Medium", "src/features/posts/api/actions.ts", "/home", ["postId", "reactionType"]],
  ["UC-30", "M04", "Binh luan hoac xoa binh luan", "Nguoi dung", "High", "src/features/posts/api/actions.ts", "/home", ["postId", "content"]],
  ["UC-31", "M04", "Chia se bai viet", "Nguoi dung", "Medium", "src/features/posts/api/actions.ts", "/home", ["postId", "commentContent"]],
  ["UC-32", "M04", "Tim nguoi de nhac ten", "Nguoi dung", "Low", "src/features/posts/api/actions.ts", "/home", ["query"]],
  ["UC-33", "M04", "Xem chi tiet bai viet", "Nguoi dung", "High", "src/features/posts/api/queries.ts", "/posts/[id]", ["postId"]],
  ["UC-34", "M05", "Tim kiem tong hop", "Nguoi dung", "High", "src/features/search/api/actions.ts", "/search", ["query"]],
  ["UC-35", "M05", "Xem goi y ket noi", "Nguoi dung", "Medium", "src/features/network/api/actions.ts", "/network", ["currentUserId"]],
  ["UC-36", "M05", "Gui hoac huy loi moi ket noi", "Nguoi dung", "High", "src/features/network/api/actions.ts", "/network", ["targetUserId"]],
  ["UC-37", "M05", "Phan hoi loi moi ket noi", "Nguoi dung", "High", "src/features/network/api/actions.ts", "/network", ["requestId", "response"]],
  ["UC-38", "M05", "Huy ket noi", "Nguoi dung", "Medium", "src/features/network/api/actions.ts", "/network", ["targetUserId"]],
  ["UC-39", "M05", "Theo doi hoac bo theo doi nguoi dung", "Nguoi dung", "Medium", "src/features/network/api/actions.ts", "/profile/[id]", ["targetUserId"]],
  ["UC-40", "M05", "Chan hoac bo chan nguoi dung", "Nguoi dung", "High", "src/features/network/api/actions.ts", "/profile/[id]|/settings", ["targetUserId"]],
  ["UC-41", "M06", "Tim kiem va loc viec lam", "Thanh vien", "High", "src/features/jobs/api/queries.ts", "/jobs", ["filters"]],
  ["UC-42", "M06", "Xem chi tiet viec lam", "Nguoi dung", "High", "src/features/jobs/api/queries.ts", "/jobs/[id]", ["jobId"]],
  ["UC-43", "M06", "Luu hoac bo luu viec lam", "Thanh vien", "High", "src/features/jobs/api/actions.ts", "/jobs/[id]", ["jobId"]],
  ["UC-44", "M06", "Dang tin tuyen dung", "Cong ty", "High", "src/features/jobs/api/actions.ts", "/company/post-job", ["title", "description", "jobTypeId", "workModeId"]],
  ["UC-45", "M06", "Sua tin tuyen dung", "Cong ty", "High", "src/features/jobs/api/actions.ts", "/company/post-job/[id]", ["jobId", "title"]],
  ["UC-46", "M06", "Doi trang thai tin tuyen dung", "Cong ty", "High", "src/features/companies/api/actions.ts", "/company/post-job/[id]", ["jobId", "newStatus"]],
  ["UC-47", "M06", "Ung tuyen viec lam", "Thanh vien", "High", "src/features/jobs/api/actions.ts", "/jobs/[id]", ["jobId", "resumeCvId"]],
  ["UC-48", "M06", "Xem hoac rut ho so da ung tuyen", "Thanh vien", "High", "src/features/jobs/api/actions.ts", "/jobs/applications", ["applicationId"]],
  ["UC-49", "M06", "Tao thong bao ung tuyen", "Tac vu tu dong", "Medium", "src/features/jobs/services/application-notifications.ts", "job application event", ["applicationId", "companyUserId"]],
  ["UC-50", "M07", "Mo hoac tao hoi thoai truc tiep", "Nguoi dung", "High", "src/features/messaging/api/actions.ts", "/messages", ["targetUserId"]],
  ["UC-51", "M07", "Gui tin nhan", "Nguoi dung", "High", "src/features/messaging/api/actions.ts", "/messages", ["conversationId", "content"]],
  ["UC-52", "M07", "Xem tin nhan va danh dau da doc", "Nguoi dung", "High", "src/features/messaging/api/actions.ts", "/messages", ["conversationId"]],
  ["UC-53", "M07", "Xem thong bao", "Nguoi dung", "High", "src/features/notifications/api/queries.ts", "/notifications", ["cursor"]],
  ["UC-54", "M07", "Danh dau thong bao da doc", "Nguoi dung", "Medium", "src/features/notifications/api/actions.ts", "/notifications", ["notificationId"]],
  ["UC-55", "M07", "Cap nhat lua chon nhan thong bao", "Nguoi dung", "Medium", "src/features/notifications/api/actions.ts", "/settings", ["category", "channel", "enabled"]],
  ["UC-56", "M08", "Cap nhat thong tin tai khoan", "Nguoi dung", "High", "src/features/settings/api/actions.ts", "/settings", ["emailOrPhoneOrLocale"]],
  ["UC-57", "M08", "Doi mat khau", "Nguoi dung", "High", "src/features/settings/api/actions.ts", "/settings", ["currentPassword", "newPassword"]],
  ["UC-58", "M08", "Cap nhat quyen rieng tu ho so", "Nguoi dung", "High", "src/features/settings/api/actions.ts", "/settings", ["profileVisibility"]],
  ["UC-59", "M08", "Xem tai khoan da chan va bo chan", "Nguoi dung", "Medium", "src/features/settings/components/blocked-accounts-card.tsx", "/settings", ["blockedUserId"]],
  ["UC-60", "M08", "Gui bao cao vi pham", "Nguoi dung", "High", "src/features/reports/api/actions.ts", "report dialog", ["targetType", "targetId", "reason"]],
  ["UC-61", "M09", "Xem tong quan quan tri", "Quan tri vien", "High", "src/features/admin/api/dashboard.ts", "/admin/dashboard", ["adminSession"]],
  ["UC-62", "M09", "Quan ly trang thai nguoi dung", "Quan tri vien", "High", "src/features/admin/api/users.ts", "/admin/users", ["userId", "action"]],
  ["UC-63", "M09", "Quan ly xac minh va trang thai cong ty", "Quan tri vien", "High", "src/features/admin/api/companies.ts", "/admin/companies", ["companyUserId", "action"]],
  ["UC-64", "M09", "Kiem duyet bai viet", "Quan tri vien", "High", "src/features/admin/api/posts.ts", "/admin/posts", ["postId", "action"]],
  ["UC-65", "M09", "Kiem duyet tin tuyen dung", "Quan tri vien", "High", "src/features/admin/api/jobs.ts", "/admin/jobs", ["jobId", "action"]],
  ["UC-66", "M09", "Xu ly bao cao vi pham", "Quan tri vien", "High", "src/features/admin/api/reports.ts", "/admin/reports", ["reportId", "action"]],
  ["UC-67", "M09", "Xem nhat ky quan tri", "Quan tri vien", "Medium", "src/features/admin/api/audit.ts", "/admin/audit-log", ["filters"]],
]

function slug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const ucBusinessRules = {
  "UC-01": ["member account is created with role member and verification email is requested", "duplicate email, weak password, or missing terms is rejected", "guest state moves to registered account waiting for email verification", "Supabase Auth user and public.users mirror are created consistently", "register form keeps safe input and highlights invalid required fields"],
  "UC-02": ["company account and company profile are created with pending verification state", "duplicate tax id/email or missing representative information is rejected", "guest state moves to company account pending verification", "Auth user, public.users row, and company_profiles row stay synchronized", "company register form exposes company-only fields and approval notice"],
  "UC-03": ["valid email verification callback exchanges code and activates email session/state", "expired, reused, or malformed code redirects to a safe login error", "unverified account moves to verified email state", "Supabase callback and app redirect target stay aligned", "callback page/redirect gives clear success or failure feedback"],
  "UC-04": ["valid email/password signs in and loads the app user mirror", "wrong credentials or missing app user mirror signs out and shows safe error", "guest session moves to authenticated session when UC-06 passes", "Supabase Auth session and public.users role/status checks stay consistent", "login form shows loading, success redirect, and translated error states"],
  "UC-05": ["Google OAuth starts and returns through the auth callback successfully", "OAuth cancellation, disabled provider, or invalid email stops login safely", "guest moves through external provider state into authenticated session", "Google OAuth, Supabase Auth, and callback redirect cooperate without orphan session", "Google button disables while redirecting and surfaces provider errors"],
  "UC-06": ["active allowed account passes access gate for protected routes/actions", "suspended, banned, deleted, or pending company account is blocked", "session request moves to allowed, redirected, or signed-out state", "middleware/auth-server guards agree on user status and role", "user sees login reason instead of a blank protected page"],
  "UC-07": ["valid reset request sends a password reset email without leaking account existence", "unknown or malformed email returns neutral response", "guest request moves to reset-email-sent or safe-neutral state", "SMTP/Supabase reset link generation does not expose private user data", "forgot password form confirms next steps consistently"],
  "UC-08": ["signed-in user signs out and local session is cleared", "repeat logout or expired session remains idempotent", "authenticated session moves to guest state", "Supabase client session, middleware cookie state, and router redirect align", "menu item shows progress and returns to login/public surface"],
  "UC-09": ["member profile fields update and render on public profile/edit overview", "invalid visibility or overlong about/headline is rejected", "profile draft moves to saved member profile state", "profile repo updates member_profiles without changing unrelated account data", "edit form reflects saved values and field-level errors"],
  "UC-10": ["avatar or cover image uploads and updates the member profile media URL", "non-image, oversized image, or failed crop/upload is rejected", "profile media moves from old image to new image state", "storage upload and profile media update stay atomic enough for retry", "image editor shows preview, loading, and rollback/error feedback"],
  "UC-11": ["member can add, edit, and delete a work experience entry", "missing company, missing position, or invalid date range is rejected", "experience list moves through created, updated, and removed states", "member_experiences updates only rows owned by the current member", "experience section updates without losing other profile form state"],
  "UC-12": ["member can add, edit, and delete an education entry", "missing school, invalid dates, or overlong description is rejected", "education list moves through created, updated, and removed states", "member_educations updates only rows owned by the current member", "education section shows empty, editing, saved, and deleted states"],
  "UC-13": ["member can add and remove professional skills", "empty, duplicate, or too-long skill names are rejected or normalized", "skill list moves through added and removed states", "member_skills normalization avoids duplicate semantic entries", "skills section keeps quick-add feedback and duplicate messaging clear"],
  "UC-14": ["viewer can see a profile allowed by visibility rules", "private or blocked profile hides protected details", "profile view moves to visible, limited, or denied state", "profile visibility, connection relation, and block checks are applied together", "profile page shows public, private, and not-found states clearly"],
  "UC-15": ["profile owner can view profile statistics and recent view counters", "non-owner or invalid target cannot fetch private stats", "view log aggregation moves to updated stats after profile views", "profile_view_logs and profile counters stay consistent", "stats card shows loading, empty, and populated states"],
  "UC-16": ["member uploads a PDF CV and it appears in saved CV list", "non-PDF, oversized file, missing file name, or failed upload is rejected", "CV moves from local file to private storage metadata state", "cvs storage object and member_cvs metadata row stay paired", "CV upload dialog shows progress, validation, success, and retry feedback"],
  "UC-17": ["member generates a CV from profile data and registers it as a saved CV", "missing profile basics or invalid builder config is rejected", "profile data moves into builder preview and saved CV metadata", "profile query, PDF generation, and CV registration remain traceable", "builder dialog preview and save states are clear"],
  "UC-18": ["member lists, renames, views, and deletes a saved CV", "unknown CV id or another user's CV is rejected", "CV item moves through listed, renamed, signed-url, and deleted states", "private CV signed URL is issued only for allowed access", "CV section shows empty list, loading, rename, viewer, and delete confirmation"],
  "UC-19": ["member marks exactly one saved CV as default", "invalid or non-owned CV cannot become default", "default flag moves from previous CV to selected CV", "set_default_member_cv keeps a single default per user", "CV card badges update immediately and do not show two defaults"],
  "UC-20": ["company profile information is updated and appears on settings/public page", "missing company name, invalid tax id, or overlong fields are rejected", "company profile moves to saved updated state", "company_profiles update is scoped to current company account", "company form shows saved values and validation feedback"],
  "UC-21": ["company logo or cover image uploads and updates company profile media", "non-image, oversized file, or failed upload is rejected", "company media moves from old asset to new asset state", "storage upload and company_profiles media columns stay consistent", "company image editor shows preview/progress/error states"],
  "UC-22": ["company toggles open-to-hire state successfully", "non-company account cannot update company hiring state", "open_to_hire moves between true and false states", "settings action updates company profile without altering verification status", "toggle reflects optimistic and saved state accurately"],
  "UC-23": ["eligible company resubmits verification after rejection or pending update", "already verified or ineligible company cannot resubmit", "verification status moves back to pending review", "company verification RPC and audit log record the resubmission", "verification card shows pending status and next-step copy"],
  "UC-24": ["user opens a company page with company profile, posts, and active jobs", "missing, suspended, or hidden company returns safe empty/not-found state", "company page moves to loaded public overview state", "company overview RPC joins profile, posts, follower state, and jobs consistently", "company page handles loading, empty jobs, and follow state"],
  "UC-25": ["user follows and unfollows a company idempotently", "blocked, invalid, or self-ineligible follow target is rejected", "follow state toggles and follower count changes by one", "follows row, follower count, notification, and revalidation stay consistent", "follow button updates instantly and recovers on failure"],
  "UC-26": ["user loads paged home feed with visible posts", "blocked/private/deleted posts are excluded", "feed cursor moves from first page to next page", "feed RPC respects visibility, connections, and pagination", "feed shows skeleton, empty state, and load-more state"],
  "UC-27": ["user creates a text/media/article post", "empty post, too many media files, or overlong content is rejected", "composer draft moves to published feed item", "post creation, media storage, fanout, and counters stay consistent", "composer resets on success and preserves draft on validation error"],
  "UC-28": ["post owner edits or deletes their own post", "non-owner, moderated, or deleted post cannot be modified", "post moves through updated or soft-deleted state", "post update/delete service updates feed visibility and audit side effects", "post menu reflects owner-only actions and confirmation states"],
  "UC-29": ["user toggles a reaction on a visible post", "hidden/deleted post or invalid reaction type is rejected", "reaction state toggles on/off and count updates", "post_reactions row and post reaction_count stay synchronized", "reaction button updates optimistically and rolls back on error"],
  "UC-30": ["user comments on a post and deletes own comment", "empty/overlong comment or hidden post is rejected", "comment moves through created and deleted states", "post_comments and post comment_count remain synchronized", "comment thread shows submit, pagination, delete, and empty states"],
  "UC-31": ["user shares a visible post with optional comment", "hidden/deleted post or overlong share comment is rejected", "share creates a feed-visible shared item/count update", "post_shares, share_count, and feed quote stay consistent", "share modal closes on success and displays validation errors"],
  "UC-32": ["user searches mentionable people while composing content", "empty/short query or blocked users return safe limited results", "mention query moves from idle to result selection state", "mention search respects connection/block/visibility rules", "mention popover handles loading, no result, keyboard selection, and insertion"],
  "UC-33": ["user opens a post detail page with comments and engagement", "not-found, deleted, or private post is hidden safely", "post detail moves to loaded or not-found/forbidden state", "detail query, comments query, and engagement state agree", "detail page renders skeleton, comments, and action availability"],
  "UC-34": ["user searches across people, companies, posts, and jobs", "blank query or unsupported filters return validation/empty result", "search state moves through all tab and filtered tab results", "search repos aggregate result counts without leaking private content", "search page shows loading, tabs, no results, and filter feedback"],
  "UC-35": ["user sees connection suggestions and network overview", "blocked users or existing connections are excluded from suggestions", "suggestion list moves from generated to dismissed/acted-on state", "suggestion RPC and connection relation state stay aligned", "network page shows requests, connections, suggestions, and empty states"],
  "UC-36": ["user sends and cancels a connection request", "self-request, duplicate request, connected user, or blocked relation is rejected", "connection state moves none -> pending -> none when cancelled", "connections row and realtime/network cache stay synchronized", "connect button updates quickly and recovers on failure"],
  "UC-37": ["receiver accepts or rejects a pending connection request", "non-receiver or non-pending request cannot be answered", "request state moves pending -> connected or rejected", "connection counters, feed sync, suggestions, and notifications update consistently", "request card disappears or changes state after response"],
  "UC-38": ["connected user removes an existing connection", "non-connected or blocked target removal is rejected safely", "connection state moves connected -> removed", "connections/follows/suggestions derived state is refreshed", "remove confirmation and connection count update correctly"],
  "UC-39": ["user follows and unfollows another user", "self-follow, blocked relation, or invalid target is rejected", "follow relation toggles on/off", "follows row, notifications, and profile relation cache remain consistent", "follow button shows current relation and optimistic updates"],
  "UC-40": ["user blocks and unblocks another user", "self-block or invalid target is rejected", "relationship moves to blocked and later unblocked state", "block removes/invalidates connection, follow, messaging, and suggestion access", "profile/settings UI shows blocked state and unblock entry point"],
  "UC-41": ["member searches and filters jobs by keyword, location, type, and mode", "invalid filters or out-of-range pagination are sanitized/rejected", "jobs list moves through filtered pages and load-more state", "jobs list RPC returns only active/visible jobs with stable totals", "jobs page shows skeleton, no result, active filters, and pagination"],
  "UC-42": ["user opens job detail with company and application/save state", "missing, removed, or inaccessible job is not shown as active", "job detail moves to loaded or not-found/closed state", "job detail query joins company, saved state, application state, and view log", "detail page shows apply/save availability and company sidebar"],
  "UC-43": ["member saves and unsaves a job", "company/admin/non-member or invalid job cannot save", "saved state toggles on/off and saved list updates", "saved_jobs row, saved jobs page, and job card cache stay consistent", "save button updates instantly and handles repeat clicks"],
  "UC-44": ["verified company creates a job post with required job fields", "unverified company, invalid salary range, or missing required fields is rejected", "job draft/form moves to created job state", "create job service checks company policy and writes audit log", "post job form shows validation, submit loading, and created redirect"],
  "UC-45": ["company edits a job it owns", "non-owner, unverified company, or invalid salary/status edit is rejected", "job moves to updated detail/list state", "job update service preserves ownership and writes audit log/revalidation", "edit form loads existing values and shows save feedback"],
  "UC-46": ["company changes job status such as open, closed, draft, or expired where allowed", "invalid status transition or non-owned job is rejected", "job status moves to selected allowed state", "status update RPC updates jobs and invalidates public/company views", "status control reflects disabled, loading, success, and rejected transitions"],
  "UC-47": ["member applies to an open job using a saved CV and optional cover letter", "missing CV, already applied, closed job, or company user is rejected", "application moves to submitted state", "job_applications row, selected CV access, notification, and audit stay consistent", "apply dialog validates CV selection and closes on success"],
  "UC-48": ["member views applications and withdraws an allowed application", "non-owner application or non-withdrawable state is rejected", "application state moves submitted -> withdrawn", "applications list, job detail application state, and company notification stay consistent", "applications page shows status badges and withdraw confirmation"],
  "UC-49": ["system creates notification for company when application is submitted or withdrawn", "invalid event or missing recipient is ignored/logged safely", "notification state moves from absent to queued/in-app visible", "application service and notification creation share the same application payload", "company notification badge/list updates without duplicate entries"],
  "UC-50": ["user opens existing or creates direct conversation with another allowed user", "blocked relation, self target, or invalid target is rejected", "conversation state moves absent -> existing/direct conversation", "conversation participants are created once and unread counters stay initialized", "message button opens dock/page quickly with existing thread"],
  "UC-51": ["user sends a text message in a conversation", "empty/overlong message, non-participant, or blocked relation is rejected", "message state moves to sent and conversation last message updates", "messages table, conversation summary, unread counter, and realtime event stay consistent", "chat input clears on success and preserves message on failure"],
  "UC-52": ["user loads messages and marks conversation read", "non-participant conversation cannot be read", "unread conversation moves to read state", "participant last_read_at/unread_count and navbar badge update together", "chat panel paginates older messages and shows read state"],
  "UC-53": ["user views paged notifications and unread count", "invalid cursor or another user's notification data is rejected/hidden", "notification list moves through initial page and load-more state", "notifications query, unread count, and realtime updates stay aligned", "notification list shows skeleton, empty state, unread badge, and target links"],
  "UC-54": ["user marks one or all notifications as read", "another user's notification id or invalid id is rejected", "notification state moves unread -> read", "notifications read_at and unread count cache stay consistent", "read action updates badge/list immediately"],
  "UC-55": ["user updates notification preferences per category/channel", "unknown category/channel or invalid boolean payload is rejected", "preference state moves to selected enabled/disabled value", "notification creation respects in-app/email preferences for later events", "settings preference switches show loading and saved state"],
  "UC-56": ["user updates account email, phone, or locale", "invalid email/phone/locale or duplicate email is rejected", "account info moves to pending verification or saved account state", "Supabase Auth, public.users, email change mailer, and audit state stay consistent", "settings account card shows verification and saved feedback"],
  "UC-57": ["user changes password with the correct current password", "wrong current password or weak new password is rejected", "password credential moves to updated state without changing session unexpectedly", "Supabase Auth update and audit log record the change safely", "password form clears sensitive fields after success or error"],
  "UC-58": ["user updates profile privacy or hiring/open-to-work status", "invalid visibility value or wrong role-specific toggle is rejected", "privacy/status moves to selected visibility or availability state", "profile visibility affects UC-14 and company/member availability surfaces", "privacy card shows current value and saved/error state"],
  "UC-59": ["user lists blocked accounts and unblocks one", "invalid blocked user id or non-blocked target is rejected", "blocked account list moves from containing target to removed target", "network block actions refresh settings list and relationship state", "blocked accounts card shows empty, loading, and remove feedback"],
  "UC-60": ["user reports a valid target with a fixed reason and optional description", "missing reason, invalid target type/id, or self-ineligible target is rejected", "report state moves to pending moderation", "reports row is visible to admin UC-66 without exposing reporter details publicly", "report dialog validates reason and thanks user on success"],
  "UC-61": ["admin opens dashboard and sees aggregate operational metrics", "non-admin cannot access dashboard data", "dashboard state moves to loaded aggregate snapshot", "dashboard service aggregates users, companies, jobs, posts, reports, and recent activity", "admin dashboard shows loading and empty metric states"],
  "UC-62": ["admin filters users and changes allowed user status", "admin cannot self-ban or modify forbidden admin target", "user status moves active/suspended/banned/restored as allowed", "user moderation writes audit log and revalidates admin users section", "users panel shows filters, status badges, and action feedback"],
  "UC-63": ["admin reviews company verification and updates company status", "missing rejection note or invalid company state is rejected", "company verification moves approved/rejected/pending_update/suspended as allowed", "company moderation updates company_profiles and writes audit log", "companies panel shows review note, filters, and status feedback"],
  "UC-64": ["admin moderates a reported or violating post", "invalid post id or already deleted post is handled safely", "post moderation state moves hidden/restored/deleted as allowed", "post moderation service updates post status and audit log", "posts panel keeps filters and shows action result"],
  "UC-65": ["admin moderates a job posting", "invalid job id or unsupported moderation action is rejected", "job moderation state moves active/removed/restored as allowed", "job moderation service updates jobs status and audit log", "jobs panel shows applications count, filters, and status action feedback"],
  "UC-66": ["admin changes report status or applies a moderation action", "invalid transition, missing reason, or already resolved report is rejected", "report state moves pending/reviewing/resolved/dismissed", "report, moderation_actions, target entity, and audit log stay consistent", "reports panel shows action modal, status badge, and result feedback"],
  "UC-67": ["admin views audit log with filters and pagination", "non-admin or invalid filters cannot access private audit data", "audit page moves through filtered page states", "audit service reads audit view/count/distinct filters consistently", "audit log page shows filter chips, empty state, and paged results"],
}

function businessRulesFor(uc, title) {
  const rules = ucBusinessRules[uc]
  if (rules) return rules
  return [
    `${title} completes the SRS-defined main business result`,
    `${title} rejects the SRS-defined alternative or exception path`,
    `${title} moves the target entity through its expected state change`,
    `${title} keeps dependent data and cross-feature side effects consistent`,
    `${title} shows loading, success, empty, and error feedback clearly`,
  ]
}

function buildBusinessCases(uc, title, actor, route, codeEntry, requiredFields) {
  const fields = requiredFields.join(", ")
  const [mainRule, alternateRule, stateRule, integrationRule, uiRule] =
    businessRulesFor(uc, title)
  return [
    {
      id: `${uc}-business-main-flow`,
      kind: "business_flow",
      title: `Run SRS business flow for ${title}`,
      preconditions: [
        `Actor ${actor} matches the SRS actor for ${uc}`,
        `Route or entry point ${route} is reachable`,
      ],
      steps: [
        `Open ${route}`,
        `Start the ${title} control mapped to ${codeEntry}`,
        `Complete the flow using business data: ${fields}`,
        "Confirm the final business result and returned state",
      ],
      expected: [
        mainRule,
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed",
      ],
      dataChecks: [mainRule, `Input fields covered: ${fields}`],
    },
    {
      id: `${uc}-alternate-business-flow`,
      kind: "alternate_flow",
      title: `Exercise SRS alternative flow for ${title}`,
      preconditions: [`Actor ${actor} can start ${title}`, "Prepare data that triggers the documented exception path"],
      steps: [
        `Open ${route}`,
        `Use the alternate or exception business condition for ${title}`,
        "Submit the flow and inspect the action result",
      ],
      expected: [
        alternateRule,
        "The system explains the rejection without exposing sensitive data",
      ],
      dataChecks: [alternateRule, "No partial mutation is committed"],
    },
    {
      id: `${uc}-business-state-transition`,
      kind: "state_transition",
      title: `Verify business state transition for ${title}`,
      preconditions: [`Record the starting state before ${title}`],
      steps: [
        `Execute ${title}`,
        "Reload the relevant page/query",
        "Compare before and after state",
      ],
      expected: [
        stateRule,
        "The transition is repeatable or idempotent according to the UC",
      ],
      dataChecks: [stateRule, "Old and new state are not both active when mutually exclusive"],
    },
    {
      id: `${uc}-business-integration-check`,
      kind: "integration",
      title: `Verify cross-feature integration for ${title}`,
      preconditions: [`Complete the main ${title} path once`],
      steps: [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action",
      ],
      expected: [
        integrationRule,
        "Dependent surfaces do not show stale or duplicated data",
      ],
      dataChecks: [integrationRule, "Related cache/revalidation/realtime output is consistent"],
    },
    {
      id: `${uc}-business-ui-feedback`,
      kind: "ui_feedback",
      title: `Verify UI feedback for ${title}`,
      preconditions: [`Open the UI surface for ${title}`],
      steps: [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior",
      ],
      expected: [
        uiRule,
        "The UI does not feel stuck, stale, or ambiguous after the action",
      ],
      dataChecks: [uiRule, "Visible state matches action/query result"],
    },
  ]
}

function buildCases(uc, title, actor, route, codeEntry, requiredFields) {
  const fields = requiredFields.join(", ")
  return [
    {
      id: `${uc}-valid-${slug(title)}`,
      kind: "valid",
      title: `Happy path completes ${title}`,
      preconditions: [`Actor ${actor} has the correct starting state`, `Open ${route}`],
      steps: [
        `Navigate to ${route}`,
        `Provide valid data for ${fields}`,
        `Submit or trigger the ${title} flow`,
        "Observe the returned UI/action result",
      ],
      expected: [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values",
      ],
      dataChecks: [`${fields} are persisted or returned correctly`, "No unrelated entity is changed"],
    },
    {
      id: `${uc}-not-null-required-fields`,
      kind: "not_null",
      title: `Reject missing required data for ${title}`,
      preconditions: [`Actor ${actor} can reach ${route}`],
      steps: [
        `Open ${route}`,
        `Leave one required value empty: ${fields}`,
        `Submit or trigger the ${title} flow`,
      ],
      expected: [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field",
      ],
      dataChecks: [`Required fields are enforced: ${fields}`, "Database row count/state remains unchanged"],
    },
    {
      id: `${uc}-auth-required`,
      kind: "auth",
      title: `Enforce authentication boundary for ${title}`,
      preconditions: ["No active authenticated session or an expired session"],
      steps: [
        `Attempt to access ${route}`,
        `Trigger the ${title} flow`,
        "Inspect redirect, action result or toast",
      ],
      expected: [
        "Unauthenticated access is redirected or rejected",
        "No business data is created, updated or leaked",
      ],
      dataChecks: ["Session guard is evaluated before business mutation", "Sensitive payload is not returned"],
    },
    {
      id: `${uc}-permission-ownership-state`,
      kind: "permission",
      title: `Reject wrong actor, owner or state for ${title}`,
      preconditions: ["Use an account without the required role, ownership or business state"],
      steps: [
        `Open or call ${route} with a valid-looking payload`,
        `Use target data that belongs to another user or is in a forbidden state`,
        `Submit the ${title} flow`,
      ],
      expected: [
        "The operation is denied with a business-safe error",
        "The forbidden target remains unchanged",
      ],
      dataChecks: ["Role/ownership/status guard is checked", "Audit/log state is not falsely recorded as success"],
    },
    {
      id: `${uc}-boundary-invalid-input`,
      kind: "boundary",
      title: `Validate invalid or boundary input for ${title}`,
      preconditions: [`Actor ${actor} can reach ${route}`],
      steps: [
        `Prepare boundary values for ${fields}`,
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        `Submit the ${title} flow`,
      ],
      expected: [
        "Invalid boundary input is rejected consistently",
        "The message identifies what must be fixed",
      ],
      dataChecks: ["Schema or service validation rejects invalid payload", "No partial write is left behind"],
    },
    {
      id: `${uc}-side-effect-consistency`,
      kind: "side_effect",
      title: `Verify side effects and cache consistency for ${title}`,
      preconditions: [`The ${title} happy path has completed once`],
      steps: [
        "Refresh the relevant page or reload the query",
        "Check counters, notifications, audit logs, realtime badge or cache state when applicable",
        "Repeat the action if it is idempotent or reversible",
      ],
      expected: [
        "Derived counts, notifications, cache and audit data stay consistent",
        "Repeating/reversing the action does not create duplicate or stale state",
      ],
      dataChecks: ["Related aggregate/counter/cache state is consistent", "Expected side effects are present only once"],
    },
    ...buildBusinessCases(uc, title, actor, route, codeEntry, requiredFields),
  ]
}

function buildSuite(row) {
  const [uc, module, title, actor, priority, codeEntry, route, requiredFields] = row
  const defaults = moduleDefaults[module]
  return {
    uc,
    module,
    title,
    actor,
    priority,
    source: "SRS_Joblink.tex",
    route: route || defaults.route,
    codeEntry: codeEntry || defaults.codeEntry,
    flow: defaults.flow,
    cases: buildCases(
      uc,
      title,
      actor,
      route || defaults.route,
      codeEntry || defaults.codeEntry,
      requiredFields,
    ),
  }
}

function emitSuite(suite) {
  const dir = join(root, suite.uc)
  mkdirSync(dir, { recursive: true })
  const body = `import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite(${JSON.stringify(suite, null, 2)})
`
  writeFileSync(join(dir, "test_cases.spec.ts"), body)
}

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (entry.isDirectory() && /^UC-\d{2}$/.test(entry.name)) {
    rmSync(join(root, entry.name), { recursive: true, force: true })
  }
}

for (const row of ucList) {
  emitSuite(buildSuite(row))
}

console.log(`Generated ${ucList.length} UC testcase suites in scripts/UC-xx`)
