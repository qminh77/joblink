import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-04",
  "module": "M01",
  "title": "Dang nhap bang email va mat khau",
  "actor": "Khach",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/login",
  "codeEntry": "src/features/auth/hooks/use-login.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-04-valid-dang-nhap-bang-email-va-mat-khau",
      "kind": "valid",
      "title": "Happy path completes Dang nhap bang email va mat khau",
      "preconditions": [
        "Actor Khach has the correct starting state",
        "Open /login"
      ],
      "steps": [
        "Navigate to /login",
        "Provide valid data for email, password",
        "Submit or trigger the Dang nhap bang email va mat khau flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "email, password are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-04-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dang nhap bang email va mat khau",
      "preconditions": [
        "Actor Khach can reach /login"
      ],
      "steps": [
        "Open /login",
        "Leave one required value empty: email, password",
        "Submit or trigger the Dang nhap bang email va mat khau flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: email, password",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-04-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dang nhap bang email va mat khau",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /login",
        "Trigger the Dang nhap bang email va mat khau flow",
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
      "id": "UC-04-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dang nhap bang email va mat khau",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /login with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dang nhap bang email va mat khau flow"
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
      "id": "UC-04-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dang nhap bang email va mat khau",
      "preconditions": [
        "Actor Khach can reach /login"
      ],
      "steps": [
        "Prepare boundary values for email, password",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dang nhap bang email va mat khau flow"
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
      "id": "UC-04-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dang nhap bang email va mat khau",
      "preconditions": [
        "The Dang nhap bang email va mat khau happy path has completed once"
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
      "id": "UC-04-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Dang nhap bang email va mat khau",
      "preconditions": [
        "Actor Khach matches the SRS actor for UC-04",
        "Route or entry point /login is reachable"
      ],
      "steps": [
        "Open /login",
        "Start the Dang nhap bang email va mat khau control mapped to src/features/auth/hooks/use-login.ts",
        "Complete the flow using business data: email, password",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "valid email/password signs in and loads the app user mirror",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "valid email/password signs in and loads the app user mirror",
        "Input fields covered: email, password"
      ]
    },
    {
      "id": "UC-04-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Dang nhap bang email va mat khau",
      "preconditions": [
        "Actor Khach can start Dang nhap bang email va mat khau",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /login",
        "Use the alternate or exception business condition for Dang nhap bang email va mat khau",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "wrong credentials or missing app user mirror signs out and shows safe error",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "wrong credentials or missing app user mirror signs out and shows safe error",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-04-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Dang nhap bang email va mat khau",
      "preconditions": [
        "Record the starting state before Dang nhap bang email va mat khau"
      ],
      "steps": [
        "Execute Dang nhap bang email va mat khau",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "guest session moves to authenticated session when UC-06 passes",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "guest session moves to authenticated session when UC-06 passes",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-04-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Dang nhap bang email va mat khau",
      "preconditions": [
        "Complete the main Dang nhap bang email va mat khau path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Supabase Auth session and public.users role/status checks stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Supabase Auth session and public.users role/status checks stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-04-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Dang nhap bang email va mat khau",
      "preconditions": [
        "Open the UI surface for Dang nhap bang email va mat khau"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "login form shows loading, success redirect, and translated error states",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "login form shows loading, success redirect, and translated error states",
        "Visible state matches action/query result"
      ]
    }
  ]
})
