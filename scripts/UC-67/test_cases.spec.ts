import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-67",
  "module": "M09",
  "title": "Xem nhat ky quan tri",
  "actor": "Quan tri vien",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/admin/audit-log",
  "codeEntry": "src/features/admin/api/audit.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-67-valid-xem-nhat-ky-quan-tri",
      "kind": "valid",
      "title": "Happy path completes Xem nhat ky quan tri",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/audit-log"
      ],
      "steps": [
        "Navigate to /admin/audit-log",
        "Provide valid data for filters",
        "Submit or trigger the Xem nhat ky quan tri flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "filters are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-67-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem nhat ky quan tri",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/audit-log"
      ],
      "steps": [
        "Open /admin/audit-log",
        "Leave one required value empty: filters",
        "Submit or trigger the Xem nhat ky quan tri flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: filters",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-67-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem nhat ky quan tri",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/audit-log",
        "Trigger the Xem nhat ky quan tri flow",
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
      "id": "UC-67-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem nhat ky quan tri",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/audit-log with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem nhat ky quan tri flow"
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
      "id": "UC-67-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem nhat ky quan tri",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/audit-log"
      ],
      "steps": [
        "Prepare boundary values for filters",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem nhat ky quan tri flow"
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
      "id": "UC-67-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem nhat ky quan tri",
      "preconditions": [
        "The Xem nhat ky quan tri happy path has completed once"
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
      "id": "UC-67-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem nhat ky quan tri",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-67",
        "Route or entry point /admin/audit-log is reachable"
      ],
      "steps": [
        "Open /admin/audit-log",
        "Start the Xem nhat ky quan tri control mapped to src/features/admin/api/audit.ts",
        "Complete the flow using business data: filters",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "admin views audit log with filters and pagination",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "admin views audit log with filters and pagination",
        "Input fields covered: filters"
      ]
    },
    {
      "id": "UC-67-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem nhat ky quan tri",
      "preconditions": [
        "Actor Quan tri vien can start Xem nhat ky quan tri",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /admin/audit-log",
        "Use the alternate or exception business condition for Xem nhat ky quan tri",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "non-admin or invalid filters cannot access private audit data",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "non-admin or invalid filters cannot access private audit data",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-67-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem nhat ky quan tri",
      "preconditions": [
        "Record the starting state before Xem nhat ky quan tri"
      ],
      "steps": [
        "Execute Xem nhat ky quan tri",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "audit page moves through filtered page states",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "audit page moves through filtered page states",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-67-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem nhat ky quan tri",
      "preconditions": [
        "Complete the main Xem nhat ky quan tri path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "audit service reads audit view/count/distinct filters consistently",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "audit service reads audit view/count/distinct filters consistently",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-67-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem nhat ky quan tri",
      "preconditions": [
        "Open the UI surface for Xem nhat ky quan tri"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "audit log page shows filter chips, empty state, and paged results",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "audit log page shows filter chips, empty state, and paged results",
        "Visible state matches action/query result"
      ]
    }
  ]
})
