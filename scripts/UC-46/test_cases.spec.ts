import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-46",
  "module": "M06",
  "title": "Doi trang thai tin tuyen dung",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/post-job/[id]",
  "codeEntry": "src/features/companies/api/actions.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "UC-46-valid-doi-trang-thai-tin-tuyen-dung",
      "kind": "valid",
      "title": "Happy path completes Doi trang thai tin tuyen dung",
      "preconditions": [
        "Actor Cong ty has the correct starting state",
        "Open /company/post-job/[id]"
      ],
      "steps": [
        "Navigate to /company/post-job/[id]",
        "Provide valid data for jobId, newStatus",
        "Submit or trigger the Doi trang thai tin tuyen dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "jobId, newStatus are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-46-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Open /company/post-job/[id]",
        "Leave one required value empty: jobId, newStatus",
        "Submit or trigger the Doi trang thai tin tuyen dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, newStatus",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-46-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Doi trang thai tin tuyen dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /company/post-job/[id]",
        "Trigger the Doi trang thai tin tuyen dung flow",
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
      "id": "UC-46-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /company/post-job/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Doi trang thai tin tuyen dung flow"
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
      "id": "UC-46-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Prepare boundary values for jobId, newStatus",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Doi trang thai tin tuyen dung flow"
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
      "id": "UC-46-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Doi trang thai tin tuyen dung",
      "preconditions": [
        "The Doi trang thai tin tuyen dung happy path has completed once"
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
      "id": "UC-46-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-46",
        "Route or entry point /company/post-job/[id] is reachable"
      ],
      "steps": [
        "Open /company/post-job/[id]",
        "Start the Doi trang thai tin tuyen dung control mapped to src/features/companies/api/actions.ts",
        "Complete the flow using business data: jobId, newStatus",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "company changes job status such as open, closed, draft, or expired where allowed",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "company changes job status such as open, closed, draft, or expired where allowed",
        "Input fields covered: jobId, newStatus"
      ]
    },
    {
      "id": "UC-46-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can start Doi trang thai tin tuyen dung",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /company/post-job/[id]",
        "Use the alternate or exception business condition for Doi trang thai tin tuyen dung",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid status transition or non-owned job is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid status transition or non-owned job is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-46-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Record the starting state before Doi trang thai tin tuyen dung"
      ],
      "steps": [
        "Execute Doi trang thai tin tuyen dung",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "job status moves to selected allowed state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "job status moves to selected allowed state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-46-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Complete the main Doi trang thai tin tuyen dung path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "status update RPC updates jobs and invalidates public/company views",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "status update RPC updates jobs and invalidates public/company views",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-46-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Doi trang thai tin tuyen dung",
      "preconditions": [
        "Open the UI surface for Doi trang thai tin tuyen dung"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "status control reflects disabled, loading, success, and rejected transitions",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "status control reflects disabled, loading, success, and rejected transitions",
        "Visible state matches action/query result"
      ]
    }
  ]
})
