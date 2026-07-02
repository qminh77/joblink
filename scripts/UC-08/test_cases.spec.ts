import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-08",
  "module": "M01",
  "title": "Dang xuat khoi he thong",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "profile menu",
  "codeEntry": "src/features/auth/api/auth-client.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-08-valid-dang-xuat-khoi-he-thong",
      "kind": "valid",
      "title": "Happy path completes Dang xuat khoi he thong",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open profile menu"
      ],
      "steps": [
        "Navigate to profile menu",
        "Provide valid data for session",
        "Submit or trigger the Dang xuat khoi he thong flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "session are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-08-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dang xuat khoi he thong",
      "preconditions": [
        "Actor Nguoi dung can reach profile menu"
      ],
      "steps": [
        "Open profile menu",
        "Leave one required value empty: session",
        "Submit or trigger the Dang xuat khoi he thong flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: session",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-08-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dang xuat khoi he thong",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access profile menu",
        "Trigger the Dang xuat khoi he thong flow",
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
      "id": "UC-08-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dang xuat khoi he thong",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call profile menu with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dang xuat khoi he thong flow"
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
      "id": "UC-08-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dang xuat khoi he thong",
      "preconditions": [
        "Actor Nguoi dung can reach profile menu"
      ],
      "steps": [
        "Prepare boundary values for session",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dang xuat khoi he thong flow"
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
      "id": "UC-08-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dang xuat khoi he thong",
      "preconditions": [
        "The Dang xuat khoi he thong happy path has completed once"
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
      "id": "UC-08-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Dang xuat khoi he thong",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-08",
        "Route or entry point profile menu is reachable"
      ],
      "steps": [
        "Open profile menu",
        "Start the Dang xuat khoi he thong control mapped to src/features/auth/api/auth-client.ts",
        "Complete the flow using business data: session",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "signed-in user signs out and local session is cleared",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "signed-in user signs out and local session is cleared",
        "Input fields covered: session"
      ]
    },
    {
      "id": "UC-08-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Dang xuat khoi he thong",
      "preconditions": [
        "Actor Nguoi dung can start Dang xuat khoi he thong",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open profile menu",
        "Use the alternate or exception business condition for Dang xuat khoi he thong",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "repeat logout or expired session remains idempotent",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "repeat logout or expired session remains idempotent",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-08-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Dang xuat khoi he thong",
      "preconditions": [
        "Record the starting state before Dang xuat khoi he thong"
      ],
      "steps": [
        "Execute Dang xuat khoi he thong",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "authenticated session moves to guest state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "authenticated session moves to guest state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-08-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Dang xuat khoi he thong",
      "preconditions": [
        "Complete the main Dang xuat khoi he thong path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Supabase client session, middleware cookie state, and router redirect align",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Supabase client session, middleware cookie state, and router redirect align",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-08-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Dang xuat khoi he thong",
      "preconditions": [
        "Open the UI surface for Dang xuat khoi he thong"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "menu item shows progress and returns to login/public surface",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "menu item shows progress and returns to login/public surface",
        "Visible state matches action/query result"
      ]
    }
  ]
})
