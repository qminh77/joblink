import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-57",
  "module": "M08",
  "title": "Doi mat khau",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
  "codeEntry": "src/features/settings/api/actions.ts",
  "flow": [
    "settings/report UI",
    "settings/report hook",
    "settings/report action",
    "service/repository",
    "users/preferences/reports"
  ],
  "cases": [
    {
      "id": "UC-57-valid-doi-mat-khau",
      "kind": "valid",
      "title": "Happy path completes Doi mat khau",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /settings"
      ],
      "steps": [
        "Navigate to /settings",
        "Provide valid data for currentPassword, newPassword",
        "Submit or trigger the Doi mat khau flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "currentPassword, newPassword are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-57-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Doi mat khau",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Open /settings",
        "Leave one required value empty: currentPassword, newPassword",
        "Submit or trigger the Doi mat khau flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: currentPassword, newPassword",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-57-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Doi mat khau",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /settings",
        "Trigger the Doi mat khau flow",
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
      "id": "UC-57-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Doi mat khau",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Doi mat khau flow"
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
      "id": "UC-57-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Doi mat khau",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Prepare boundary values for currentPassword, newPassword",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Doi mat khau flow"
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
      "id": "UC-57-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Doi mat khau",
      "preconditions": [
        "The Doi mat khau happy path has completed once"
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
      "id": "UC-57-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Doi mat khau",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-57",
        "Route or entry point /settings is reachable"
      ],
      "steps": [
        "Open /settings",
        "Start the Doi mat khau control mapped to src/features/settings/api/actions.ts",
        "Complete the flow using business data: currentPassword, newPassword",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user changes password with the correct current password",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user changes password with the correct current password",
        "Input fields covered: currentPassword, newPassword"
      ]
    },
    {
      "id": "UC-57-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Doi mat khau",
      "preconditions": [
        "Actor Nguoi dung can start Doi mat khau",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /settings",
        "Use the alternate or exception business condition for Doi mat khau",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "wrong current password or weak new password is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "wrong current password or weak new password is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-57-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Doi mat khau",
      "preconditions": [
        "Record the starting state before Doi mat khau"
      ],
      "steps": [
        "Execute Doi mat khau",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "password credential moves to updated state without changing session unexpectedly",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "password credential moves to updated state without changing session unexpectedly",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-57-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Doi mat khau",
      "preconditions": [
        "Complete the main Doi mat khau path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Supabase Auth update and audit log record the change safely",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Supabase Auth update and audit log record the change safely",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-57-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Doi mat khau",
      "preconditions": [
        "Open the UI surface for Doi mat khau"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "password form clears sensitive fields after success or error",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "password form clears sensitive fields after success or error",
        "Visible state matches action/query result"
      ]
    }
  ]
})
