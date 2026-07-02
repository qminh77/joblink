import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-48",
  "module": "M06",
  "title": "Xem hoac rut ho so da ung tuyen",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs/applications",
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
      "id": "UC-48-valid-xem-hoac-rut-ho-so-da-ung-tuyen",
      "kind": "valid",
      "title": "Happy path completes Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /jobs/applications"
      ],
      "steps": [
        "Navigate to /jobs/applications",
        "Provide valid data for applicationId",
        "Submit or trigger the Xem hoac rut ho so da ung tuyen flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "applicationId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-48-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/applications"
      ],
      "steps": [
        "Open /jobs/applications",
        "Leave one required value empty: applicationId",
        "Submit or trigger the Xem hoac rut ho so da ung tuyen flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: applicationId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-48-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /jobs/applications",
        "Trigger the Xem hoac rut ho so da ung tuyen flow",
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
      "id": "UC-48-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /jobs/applications with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem hoac rut ho so da ung tuyen flow"
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
      "id": "UC-48-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Actor Thanh vien can reach /jobs/applications"
      ],
      "steps": [
        "Prepare boundary values for applicationId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem hoac rut ho so da ung tuyen flow"
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
      "id": "UC-48-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "The Xem hoac rut ho so da ung tuyen happy path has completed once"
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
      "id": "UC-48-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-48",
        "Route or entry point /jobs/applications is reachable"
      ],
      "steps": [
        "Open /jobs/applications",
        "Start the Xem hoac rut ho so da ung tuyen control mapped to src/features/jobs/api/actions.ts",
        "Complete the flow using business data: applicationId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member views applications and withdraws an allowed application",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member views applications and withdraws an allowed application",
        "Input fields covered: applicationId"
      ]
    },
    {
      "id": "UC-48-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Actor Thanh vien can start Xem hoac rut ho so da ung tuyen",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /jobs/applications",
        "Use the alternate or exception business condition for Xem hoac rut ho so da ung tuyen",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "non-owner application or non-withdrawable state is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "non-owner application or non-withdrawable state is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-48-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Record the starting state before Xem hoac rut ho so da ung tuyen"
      ],
      "steps": [
        "Execute Xem hoac rut ho so da ung tuyen",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "application state moves submitted -> withdrawn",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "application state moves submitted -> withdrawn",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-48-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Complete the main Xem hoac rut ho so da ung tuyen path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "applications list, job detail application state, and company notification stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "applications list, job detail application state, and company notification stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-48-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem hoac rut ho so da ung tuyen",
      "preconditions": [
        "Open the UI surface for Xem hoac rut ho so da ung tuyen"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "applications page shows status badges and withdraw confirmation",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "applications page shows status badges and withdraw confirmation",
        "Visible state matches action/query result"
      ]
    }
  ]
})
