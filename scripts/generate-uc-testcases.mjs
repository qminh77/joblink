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

function buildCases(uc, title, actor, route, requiredFields) {
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
    cases: buildCases(uc, title, actor, route || defaults.route, requiredFields),
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
