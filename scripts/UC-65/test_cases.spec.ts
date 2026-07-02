import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-65",
  "module": "M09",
  "title": "Kiem duyet tin tuyen dung",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/jobs",
  "codeEntry": "src/features/admin/api/jobs.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-65-valid-kiem-duyet-tin-tuyen-dung",
      "kind": "valid",
      "title": "Happy path completes Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/jobs"
      ],
      "steps": [
        "Navigate to /admin/jobs",
        "Provide valid data for jobId, action",
        "Submit or trigger the Kiem duyet tin tuyen dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "jobId, action are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-65-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/jobs"
      ],
      "steps": [
        "Open /admin/jobs",
        "Leave one required value empty: jobId, action",
        "Submit or trigger the Kiem duyet tin tuyen dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, action",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-65-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Kiem duyet tin tuyen dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/jobs",
        "Trigger the Kiem duyet tin tuyen dung flow",
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
      "id": "UC-65-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/jobs with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Kiem duyet tin tuyen dung flow"
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
      "id": "UC-65-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/jobs"
      ],
      "steps": [
        "Prepare boundary values for jobId, action",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Kiem duyet tin tuyen dung flow"
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
      "id": "UC-65-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Kiem duyet tin tuyen dung",
      "preconditions": [
        "The Kiem duyet tin tuyen dung happy path has completed once"
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
      "id": "UC-65-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-65",
        "Route or entry point /admin/jobs is reachable"
      ],
      "steps": [
        "Open /admin/jobs",
        "Start the Kiem duyet tin tuyen dung control mapped to src/features/admin/api/jobs.ts",
        "Complete the flow using business data: jobId, action",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "admin moderates a job posting",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "admin moderates a job posting",
        "Input fields covered: jobId, action"
      ]
    },
    {
      "id": "UC-65-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien can start Kiem duyet tin tuyen dung",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /admin/jobs",
        "Use the alternate or exception business condition for Kiem duyet tin tuyen dung",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid job id or unsupported moderation action is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid job id or unsupported moderation action is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-65-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Record the starting state before Kiem duyet tin tuyen dung"
      ],
      "steps": [
        "Execute Kiem duyet tin tuyen dung",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "job moderation state moves active/removed/restored as allowed",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "job moderation state moves active/removed/restored as allowed",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-65-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Complete the main Kiem duyet tin tuyen dung path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "job moderation service updates jobs status and audit log",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "job moderation service updates jobs status and audit log",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-65-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Open the UI surface for Kiem duyet tin tuyen dung"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "jobs panel shows applications count, filters, and status action feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "jobs panel shows applications count, filters, and status action feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
