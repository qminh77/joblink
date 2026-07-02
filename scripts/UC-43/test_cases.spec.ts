import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-43",
  "module": "M06",
  "title": "Luu hoac bo luu viec lam",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs/[id]",
  "codeEntry": "src/features/jobs/api/actions.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "UC-43-valid-luu-hoac-bo-luu-viec-lam",
      "kind": "valid",
      "title": "Happy path completes Luu hoac bo luu viec lam",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /jobs/[id]"
      ],
      "steps": [
        "Navigate to /jobs/[id]",
        "Provide valid data for jobId",
        "Submit or trigger the Luu hoac bo luu viec lam flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "jobId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-43-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Luu hoac bo luu viec lam",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/[id]"
      ],
      "steps": [
        "Open /jobs/[id]",
        "Leave one required value empty: jobId",
        "Submit or trigger the Luu hoac bo luu viec lam flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: jobId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-43-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Luu hoac bo luu viec lam",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /jobs/[id]",
        "Trigger the Luu hoac bo luu viec lam flow",
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
      "id": "UC-43-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Luu hoac bo luu viec lam",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /jobs/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Luu hoac bo luu viec lam flow"
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
      "id": "UC-43-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Luu hoac bo luu viec lam",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/[id]"
      ],
      "steps": [
        "Prepare boundary values for jobId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Luu hoac bo luu viec lam flow"
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
      "id": "UC-43-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Luu hoac bo luu viec lam",
      "preconditions": [
        "The Luu hoac bo luu viec lam happy path has completed once"
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
      "id": "UC-43-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Luu hoac bo luu viec lam",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-43",
        "Route or entry point /jobs/[id] is reachable"
      ],
      "steps": [
        "Open /jobs/[id]",
        "Start the Luu hoac bo luu viec lam control mapped to src/features/jobs/api/actions.ts",
        "Complete the flow using business data: jobId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member saves and unsaves a job",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member saves and unsaves a job",
        "Input fields covered: jobId"
      ]
    },
    {
      "id": "UC-43-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Luu hoac bo luu viec lam",
      "preconditions": [
        "Actor Thanh vien can start Luu hoac bo luu viec lam",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /jobs/[id]",
        "Use the alternate or exception business condition for Luu hoac bo luu viec lam",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "company/admin/non-member or invalid job cannot save",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "company/admin/non-member or invalid job cannot save",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-43-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Luu hoac bo luu viec lam",
      "preconditions": [
        "Record the starting state before Luu hoac bo luu viec lam"
      ],
      "steps": [
        "Execute Luu hoac bo luu viec lam",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "saved state toggles on/off and saved list updates",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "saved state toggles on/off and saved list updates",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-43-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Luu hoac bo luu viec lam",
      "preconditions": [
        "Complete the main Luu hoac bo luu viec lam path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "saved_jobs row, saved jobs page, and job card cache stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "saved_jobs row, saved jobs page, and job card cache stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-43-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Luu hoac bo luu viec lam",
      "preconditions": [
        "Open the UI surface for Luu hoac bo luu viec lam"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "save button updates instantly and handles repeat clicks",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "save button updates instantly and handles repeat clicks",
        "Visible state matches action/query result"
      ]
    }
  ]
})
