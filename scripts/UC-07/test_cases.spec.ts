import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-07",
  "module": "M01",
  "title": "Gui yeu cau dat lai mat khau",
  "actor": "Khach, Dich vu Email",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/forgot-password",
  "codeEntry": "src/features/auth/api/auth-actions.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-07-valid-gui-yeu-cau-dat-lai-mat-khau",
      "kind": "valid",
      "title": "Happy path completes Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Actor Khach, Dich vu Email has the correct starting state",
        "Open /forgot-password"
      ],
      "steps": [
        "Navigate to /forgot-password",
        "Provide valid data for email",
        "Submit or trigger the Gui yeu cau dat lai mat khau flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "email are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-07-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /forgot-password"
      ],
      "steps": [
        "Open /forgot-password",
        "Leave one required value empty: email",
        "Submit or trigger the Gui yeu cau dat lai mat khau flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: email",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-07-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /forgot-password",
        "Trigger the Gui yeu cau dat lai mat khau flow",
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
      "id": "UC-07-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /forgot-password with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Gui yeu cau dat lai mat khau flow"
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
      "id": "UC-07-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /forgot-password"
      ],
      "steps": [
        "Prepare boundary values for email",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Gui yeu cau dat lai mat khau flow"
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
      "id": "UC-07-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "The Gui yeu cau dat lai mat khau happy path has completed once"
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
      "id": "UC-07-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Actor Khach, Dich vu Email matches the SRS actor for UC-07",
        "Route or entry point /forgot-password is reachable"
      ],
      "steps": [
        "Open /forgot-password",
        "Start the Gui yeu cau dat lai mat khau control mapped to src/features/auth/api/auth-actions.ts",
        "Complete the flow using business data: email",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "valid reset request sends a password reset email without leaking account existence",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "valid reset request sends a password reset email without leaking account existence",
        "Input fields covered: email"
      ]
    },
    {
      "id": "UC-07-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Actor Khach, Dich vu Email can start Gui yeu cau dat lai mat khau",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /forgot-password",
        "Use the alternate or exception business condition for Gui yeu cau dat lai mat khau",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "unknown or malformed email returns neutral response",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "unknown or malformed email returns neutral response",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-07-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Record the starting state before Gui yeu cau dat lai mat khau"
      ],
      "steps": [
        "Execute Gui yeu cau dat lai mat khau",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "guest request moves to reset-email-sent or safe-neutral state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "guest request moves to reset-email-sent or safe-neutral state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-07-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Complete the main Gui yeu cau dat lai mat khau path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "SMTP/Supabase reset link generation does not expose private user data",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "SMTP/Supabase reset link generation does not expose private user data",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-07-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Gui yeu cau dat lai mat khau",
      "preconditions": [
        "Open the UI surface for Gui yeu cau dat lai mat khau"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "forgot password form confirms next steps consistently",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "forgot password form confirms next steps consistently",
        "Visible state matches action/query result"
      ]
    }
  ]
})
