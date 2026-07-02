import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-45",
  "module": "M06",
  "title": "Sua tin tuyen dung",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/post-job/[id]",
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
      "id": "UC-45-valid-sua-tin-tuyen-dung",
      "kind": "valid",
      "title": "Happy path completes Sua tin tuyen dung",
      "preconditions": [
        "Actor Cong ty has the correct starting state",
        "Open /company/post-job/[id]"
      ],
      "steps": [
        "Navigate to /company/post-job/[id]",
        "Provide valid data for jobId, title",
        "Submit or trigger the Sua tin tuyen dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "jobId, title are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-45-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Sua tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Open /company/post-job/[id]",
        "Leave one required value empty: jobId, title",
        "Submit or trigger the Sua tin tuyen dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, title",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-45-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Sua tin tuyen dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /company/post-job/[id]",
        "Trigger the Sua tin tuyen dung flow",
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
      "id": "UC-45-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Sua tin tuyen dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /company/post-job/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Sua tin tuyen dung flow"
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
      "id": "UC-45-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Sua tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job/[id]"
      ],
      "steps": [
        "Prepare boundary values for jobId, title",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Sua tin tuyen dung flow"
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
      "id": "UC-45-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Sua tin tuyen dung",
      "preconditions": [
        "The Sua tin tuyen dung happy path has completed once"
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
      "id": "UC-45-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Sua tin tuyen dung",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-45",
        "Route or entry point /company/post-job/[id] is reachable"
      ],
      "steps": [
        "Open /company/post-job/[id]",
        "Start the Sua tin tuyen dung control mapped to src/features/jobs/api/actions.ts",
        "Complete the flow using business data: jobId, title",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "company edits a job it owns",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "company edits a job it owns",
        "Input fields covered: jobId, title"
      ]
    },
    {
      "id": "UC-45-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Sua tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can start Sua tin tuyen dung",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /company/post-job/[id]",
        "Use the alternate or exception business condition for Sua tin tuyen dung",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "non-owner, unverified company, or invalid salary/status edit is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "non-owner, unverified company, or invalid salary/status edit is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-45-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Sua tin tuyen dung",
      "preconditions": [
        "Record the starting state before Sua tin tuyen dung"
      ],
      "steps": [
        "Execute Sua tin tuyen dung",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "job moves to updated detail/list state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "job moves to updated detail/list state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-45-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Sua tin tuyen dung",
      "preconditions": [
        "Complete the main Sua tin tuyen dung path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "job update service preserves ownership and writes audit log/revalidation",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "job update service preserves ownership and writes audit log/revalidation",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-45-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Sua tin tuyen dung",
      "preconditions": [
        "Open the UI surface for Sua tin tuyen dung"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "edit form loads existing values and shows save feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "edit form loads existing values and shows save feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
