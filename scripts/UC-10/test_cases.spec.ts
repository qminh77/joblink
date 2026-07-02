import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-10",
  "module": "M02",
  "title": "Cap nhat anh ca nhan",
  "actor": "Thanh vien",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/profile/edit",
  "codeEntry": "src/features/profile/api/actions.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "UC-10-valid-cap-nhat-anh-ca-nhan",
      "kind": "valid",
      "title": "Happy path completes Cap nhat anh ca nhan",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /profile/edit"
      ],
      "steps": [
        "Navigate to /profile/edit",
        "Provide valid data for avatarFile, coverFile",
        "Submit or trigger the Cap nhat anh ca nhan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "avatarFile, coverFile are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-10-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Cap nhat anh ca nhan",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Open /profile/edit",
        "Leave one required value empty: avatarFile, coverFile",
        "Submit or trigger the Cap nhat anh ca nhan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: avatarFile, coverFile",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-10-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Cap nhat anh ca nhan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/edit",
        "Trigger the Cap nhat anh ca nhan flow",
        "Inspect redirect, action result or toast"
      ],
      "expected": [
        "Unauthenticated access is redirected or rejected",
        "No business data is created, updated or leaked"
      ],
      "dataChecks": [
        "Session guard is evaluated before business mutation",
        "Sensitive payload is not returned"
      ]
    },
    {
      "id": "UC-10-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Cap nhat anh ca nhan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/edit with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Cap nhat anh ca nhan flow"
      ],
      "expected": [
        "The operation is denied with a business-safe error",
        "The forbidden target remains unchanged"
      ],
      "dataChecks": [
        "Role/ownership/status guard is checked",
        "Audit/log state is not falsely recorded as success"
      ]
    },
    {
      "id": "UC-10-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Cap nhat anh ca nhan",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Prepare boundary values for avatarFile, coverFile",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Cap nhat anh ca nhan flow"
      ],
      "expected": [
        "Invalid boundary input is rejected consistently",
        "The message identifies what must be fixed"
      ],
      "dataChecks": [
        "Schema or service validation rejects invalid payload",
        "No partial write is left behind"
      ]
    },
    {
      "id": "UC-10-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Cap nhat anh ca nhan",
      "preconditions": [
        "The Cap nhat anh ca nhan happy path has completed once"
      ],
      "steps": [
        "Refresh the relevant page or reload the query",
        "Check counters, notifications, audit logs, realtime badge or cache state when applicable",
        "Repeat the action if it is idempotent or reversible"
      ],
      "expected": [
        "Derived counts, notifications, cache and audit data stay consistent",
        "Repeating/reversing the action does not create duplicate or stale state"
      ],
      "dataChecks": [
        "Related aggregate/counter/cache state is consistent",
        "Expected side effects are present only once"
      ]
    },
    {
      "id": "UC-10-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Cap nhat anh ca nhan",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-10",
        "Route or entry point /profile/edit is reachable"
      ],
      "steps": [
        "Open /profile/edit",
        "Start the Cap nhat anh ca nhan control mapped to src/features/profile/api/actions.ts",
        "Complete the flow using business data: avatarFile, coverFile",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "avatar or cover image uploads and updates the member profile media URL",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "avatar or cover image uploads and updates the member profile media URL",
        "Input fields covered: avatarFile, coverFile"
      ]
    },
    {
      "id": "UC-10-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Cap nhat anh ca nhan",
      "preconditions": [
        "Actor Thanh vien can start Cap nhat anh ca nhan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/edit",
        "Use the alternate or exception business condition for Cap nhat anh ca nhan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "non-image, oversized image, or failed crop/upload is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "non-image, oversized image, or failed crop/upload is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-10-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Cap nhat anh ca nhan",
      "preconditions": [
        "Record the starting state before Cap nhat anh ca nhan"
      ],
      "steps": [
        "Execute Cap nhat anh ca nhan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "profile media moves from old image to new image state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "profile media moves from old image to new image state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-10-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Cap nhat anh ca nhan",
      "preconditions": [
        "Complete the main Cap nhat anh ca nhan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "storage upload and profile media update stay atomic enough for retry",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "storage upload and profile media update stay atomic enough for retry",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-10-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Cap nhat anh ca nhan",
      "preconditions": [
        "Open the UI surface for Cap nhat anh ca nhan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "image editor shows preview, loading, and rollback/error feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "image editor shows preview, loading, and rollback/error feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
