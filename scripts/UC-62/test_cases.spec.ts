import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-62",
  "module": "M09",
  "title": "Quan ly trang thai nguoi dung",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/users",
  "codeEntry": "src/features/admin/api/users.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-62-valid-quan-ly-trang-thai-nguoi-dung",
      "kind": "valid",
      "title": "Happy path completes Quan ly trang thai nguoi dung",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/users"
      ],
      "steps": [
        "Navigate to /admin/users",
        "Provide valid data for userId, action",
        "Submit or trigger the Quan ly trang thai nguoi dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "userId, action are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-62-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/users"
      ],
      "steps": [
        "Open /admin/users",
        "Leave one required value empty: userId, action",
        "Submit or trigger the Quan ly trang thai nguoi dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: userId, action",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-62-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Quan ly trang thai nguoi dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/users",
        "Trigger the Quan ly trang thai nguoi dung flow",
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
      "id": "UC-62-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/users with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Quan ly trang thai nguoi dung flow"
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
      "id": "UC-62-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/users"
      ],
      "steps": [
        "Prepare boundary values for userId, action",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Quan ly trang thai nguoi dung flow"
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
      "id": "UC-62-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Quan ly trang thai nguoi dung",
      "preconditions": [
        "The Quan ly trang thai nguoi dung happy path has completed once"
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
      "id": "UC-62-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-62",
        "Route or entry point /admin/users is reachable"
      ],
      "steps": [
        "Open /admin/users",
        "Start the Quan ly trang thai nguoi dung control mapped to src/features/admin/api/users.ts",
        "Complete the flow using business data: userId, action",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "admin filters users and changes allowed user status",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "admin filters users and changes allowed user status",
        "Input fields covered: userId, action"
      ]
    },
    {
      "id": "UC-62-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Actor Quan tri vien can start Quan ly trang thai nguoi dung",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /admin/users",
        "Use the alternate or exception business condition for Quan ly trang thai nguoi dung",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "admin cannot self-ban or modify forbidden admin target",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "admin cannot self-ban or modify forbidden admin target",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-62-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Record the starting state before Quan ly trang thai nguoi dung"
      ],
      "steps": [
        "Execute Quan ly trang thai nguoi dung",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "user status moves active/suspended/banned/restored as allowed",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "user status moves active/suspended/banned/restored as allowed",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-62-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Complete the main Quan ly trang thai nguoi dung path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "user moderation writes audit log and revalidates admin users section",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "user moderation writes audit log and revalidates admin users section",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-62-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Quan ly trang thai nguoi dung",
      "preconditions": [
        "Open the UI surface for Quan ly trang thai nguoi dung"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "users panel shows filters, status badges, and action feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "users panel shows filters, status badges, and action feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
