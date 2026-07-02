import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-41",
  "module": "M06",
  "title": "Tim kiem va loc viec lam",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs",
  "codeEntry": "src/features/jobs/api/queries.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "UC-41-valid-tim-kiem-va-loc-viec-lam",
      "kind": "valid",
      "title": "Happy path completes Tim kiem va loc viec lam",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /jobs"
      ],
      "steps": [
        "Navigate to /jobs",
        "Provide valid data for filters",
        "Submit or trigger the Tim kiem va loc viec lam flow",
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
      "id": "UC-41-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Tim kiem va loc viec lam",
      "preconditions": [
        "Actor Thanh vien can reach /jobs"
      ],
      "steps": [
        "Open /jobs",
        "Leave one required value empty: filters",
        "Submit or trigger the Tim kiem va loc viec lam flow"
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
      "id": "UC-41-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Tim kiem va loc viec lam",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /jobs",
        "Trigger the Tim kiem va loc viec lam flow",
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
      "id": "UC-41-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Tim kiem va loc viec lam",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /jobs with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Tim kiem va loc viec lam flow"
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
      "id": "UC-41-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Tim kiem va loc viec lam",
      "preconditions": [
        "Actor Thanh vien can reach /jobs"
      ],
      "steps": [
        "Prepare boundary values for filters",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Tim kiem va loc viec lam flow"
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
      "id": "UC-41-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Tim kiem va loc viec lam",
      "preconditions": [
        "The Tim kiem va loc viec lam happy path has completed once"
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
      "id": "UC-41-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Tim kiem va loc viec lam",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-41",
        "Route or entry point /jobs is reachable"
      ],
      "steps": [
        "Open /jobs",
        "Start the Tim kiem va loc viec lam control mapped to src/features/jobs/api/queries.ts",
        "Complete the flow using business data: filters",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member searches and filters jobs by keyword, location, type, and mode",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member searches and filters jobs by keyword, location, type, and mode",
        "Input fields covered: filters"
      ]
    },
    {
      "id": "UC-41-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Tim kiem va loc viec lam",
      "preconditions": [
        "Actor Thanh vien can start Tim kiem va loc viec lam",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /jobs",
        "Use the alternate or exception business condition for Tim kiem va loc viec lam",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid filters or out-of-range pagination are sanitized/rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid filters or out-of-range pagination are sanitized/rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-41-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Tim kiem va loc viec lam",
      "preconditions": [
        "Record the starting state before Tim kiem va loc viec lam"
      ],
      "steps": [
        "Execute Tim kiem va loc viec lam",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "jobs list moves through filtered pages and load-more state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "jobs list moves through filtered pages and load-more state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-41-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Tim kiem va loc viec lam",
      "preconditions": [
        "Complete the main Tim kiem va loc viec lam path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "jobs list RPC returns only active/visible jobs with stable totals",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "jobs list RPC returns only active/visible jobs with stable totals",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-41-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Tim kiem va loc viec lam",
      "preconditions": [
        "Open the UI surface for Tim kiem va loc viec lam"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "jobs page shows skeleton, no result, active filters, and pagination",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "jobs page shows skeleton, no result, active filters, and pagination",
        "Visible state matches action/query result"
      ]
    }
  ]
})
