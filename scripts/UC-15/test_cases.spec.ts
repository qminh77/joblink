import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-15",
  "module": "M02",
  "title": "Xem thong ke ho so ca nhan",
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
      "id": "UC-15-valid-xem-thong-ke-ho-so-ca-nhan",
      "kind": "valid",
      "title": "Happy path completes Xem thong ke ho so ca nhan",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /profile/edit"
      ],
      "steps": [
        "Navigate to /profile/edit",
        "Provide valid data for targetUserId",
        "Submit or trigger the Xem thong ke ho so ca nhan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "targetUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-15-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Open /profile/edit",
        "Leave one required value empty: targetUserId",
        "Submit or trigger the Xem thong ke ho so ca nhan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: targetUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-15-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem thong ke ho so ca nhan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/edit",
        "Trigger the Xem thong ke ho so ca nhan flow",
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
      "id": "UC-15-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/edit with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem thong ke ho so ca nhan flow"
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
      "id": "UC-15-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Prepare boundary values for targetUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem thong ke ho so ca nhan flow"
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
      "id": "UC-15-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem thong ke ho so ca nhan",
      "preconditions": [
        "The Xem thong ke ho so ca nhan happy path has completed once"
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
      "id": "UC-15-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-15",
        "Route or entry point /profile/edit is reachable"
      ],
      "steps": [
        "Open /profile/edit",
        "Start the Xem thong ke ho so ca nhan control mapped to src/features/profile/api/actions.ts",
        "Complete the flow using business data: targetUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "profile owner can view profile statistics and recent view counters",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "profile owner can view profile statistics and recent view counters",
        "Input fields covered: targetUserId"
      ]
    },
    {
      "id": "UC-15-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Actor Thanh vien can start Xem thong ke ho so ca nhan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/edit",
        "Use the alternate or exception business condition for Xem thong ke ho so ca nhan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "non-owner or invalid target cannot fetch private stats",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "non-owner or invalid target cannot fetch private stats",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-15-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Record the starting state before Xem thong ke ho so ca nhan"
      ],
      "steps": [
        "Execute Xem thong ke ho so ca nhan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "view log aggregation moves to updated stats after profile views",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "view log aggregation moves to updated stats after profile views",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-15-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Complete the main Xem thong ke ho so ca nhan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "profile_view_logs and profile counters stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "profile_view_logs and profile counters stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-15-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem thong ke ho so ca nhan",
      "preconditions": [
        "Open the UI surface for Xem thong ke ho so ca nhan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "stats card shows loading, empty, and populated states",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "stats card shows loading, empty, and populated states",
        "Visible state matches action/query result"
      ]
    }
  ]
})
