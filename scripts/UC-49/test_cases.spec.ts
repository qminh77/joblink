import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-49",
  "module": "M06",
  "title": "Tao thong bao ung tuyen",
  "actor": "Tac vu tu dong",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "job application event",
  "codeEntry": "src/features/jobs/services/application-notifications.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "UC-49-valid-tao-thong-bao-ung-tuyen",
      "kind": "valid",
      "title": "Happy path completes Tao thong bao ung tuyen",
      "preconditions": [
        "Actor Tac vu tu dong has the correct starting state",
        "Open job application event"
      ],
      "steps": [
        "Navigate to job application event",
        "Provide valid data for applicationId, companyUserId",
        "Submit or trigger the Tao thong bao ung tuyen flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "applicationId, companyUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-49-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Tao thong bao ung tuyen",
      "preconditions": [
        "Actor Tac vu tu dong can reach job application event"
      ],
      "steps": [
        "Open job application event",
        "Leave one required value empty: applicationId, companyUserId",
        "Submit or trigger the Tao thong bao ung tuyen flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: applicationId, companyUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-49-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Tao thong bao ung tuyen",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access job application event",
        "Trigger the Tao thong bao ung tuyen flow",
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
      "id": "UC-49-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Tao thong bao ung tuyen",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call job application event with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Tao thong bao ung tuyen flow"
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
      "id": "UC-49-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Tao thong bao ung tuyen",
      "preconditions": [
        "Actor Tac vu tu dong can reach job application event"
      ],
      "steps": [
        "Prepare boundary values for applicationId, companyUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Tao thong bao ung tuyen flow"
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
      "id": "UC-49-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Tao thong bao ung tuyen",
      "preconditions": [
        "The Tao thong bao ung tuyen happy path has completed once"
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
      "id": "UC-49-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Tao thong bao ung tuyen",
      "preconditions": [
        "Actor Tac vu tu dong matches the SRS actor for UC-49",
        "Route or entry point job application event is reachable"
      ],
      "steps": [
        "Open job application event",
        "Start the Tao thong bao ung tuyen control mapped to src/features/jobs/services/application-notifications.ts",
        "Complete the flow using business data: applicationId, companyUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "system creates notification for company when application is submitted or withdrawn",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "system creates notification for company when application is submitted or withdrawn",
        "Input fields covered: applicationId, companyUserId"
      ]
    },
    {
      "id": "UC-49-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Tao thong bao ung tuyen",
      "preconditions": [
        "Actor Tac vu tu dong can start Tao thong bao ung tuyen",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open job application event",
        "Use the alternate or exception business condition for Tao thong bao ung tuyen",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid event or missing recipient is ignored/logged safely",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid event or missing recipient is ignored/logged safely",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-49-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Tao thong bao ung tuyen",
      "preconditions": [
        "Record the starting state before Tao thong bao ung tuyen"
      ],
      "steps": [
        "Execute Tao thong bao ung tuyen",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "notification state moves from absent to queued/in-app visible",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "notification state moves from absent to queued/in-app visible",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-49-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Tao thong bao ung tuyen",
      "preconditions": [
        "Complete the main Tao thong bao ung tuyen path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "application service and notification creation share the same application payload",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "application service and notification creation share the same application payload",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-49-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Tao thong bao ung tuyen",
      "preconditions": [
        "Open the UI surface for Tao thong bao ung tuyen"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "company notification badge/list updates without duplicate entries",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "company notification badge/list updates without duplicate entries",
        "Visible state matches action/query result"
      ]
    }
  ]
})
