import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-06",
  "module": "M01",
  "title": "Kiem tra dieu kien truy cap tai khoan",
  "actor": "Tac vu tu dong",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "protected routes",
  "codeEntry": "src/features/auth/api/auth-server.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-06-valid-kiem-tra-dieu-kien-truy-cap-tai-khoan",
      "kind": "valid",
      "title": "Happy path completes Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Actor Tac vu tu dong has the correct starting state",
        "Open protected routes"
      ],
      "steps": [
        "Navigate to protected routes",
        "Provide valid data for authSession, userStatus, role",
        "Submit or trigger the Kiem tra dieu kien truy cap tai khoan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "authSession, userStatus, role are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-06-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Actor Tac vu tu dong can reach protected routes"
      ],
      "steps": [
        "Open protected routes",
        "Leave one required value empty: authSession, userStatus, role",
        "Submit or trigger the Kiem tra dieu kien truy cap tai khoan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: authSession, userStatus, role",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-06-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access protected routes",
        "Trigger the Kiem tra dieu kien truy cap tai khoan flow",
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
      "id": "UC-06-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call protected routes with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Kiem tra dieu kien truy cap tai khoan flow"
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
      "id": "UC-06-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Actor Tac vu tu dong can reach protected routes"
      ],
      "steps": [
        "Prepare boundary values for authSession, userStatus, role",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Kiem tra dieu kien truy cap tai khoan flow"
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
      "id": "UC-06-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "The Kiem tra dieu kien truy cap tai khoan happy path has completed once"
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
      "id": "UC-06-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Actor Tac vu tu dong matches the SRS actor for UC-06",
        "Route or entry point protected routes is reachable"
      ],
      "steps": [
        "Open protected routes",
        "Start the Kiem tra dieu kien truy cap tai khoan control mapped to src/features/auth/api/auth-server.ts",
        "Complete the flow using business data: authSession, userStatus, role",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "active allowed account passes access gate for protected routes/actions",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "active allowed account passes access gate for protected routes/actions",
        "Input fields covered: authSession, userStatus, role"
      ]
    },
    {
      "id": "UC-06-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Actor Tac vu tu dong can start Kiem tra dieu kien truy cap tai khoan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open protected routes",
        "Use the alternate or exception business condition for Kiem tra dieu kien truy cap tai khoan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "suspended, banned, deleted, or pending company account is blocked",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "suspended, banned, deleted, or pending company account is blocked",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-06-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Record the starting state before Kiem tra dieu kien truy cap tai khoan"
      ],
      "steps": [
        "Execute Kiem tra dieu kien truy cap tai khoan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "session request moves to allowed, redirected, or signed-out state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "session request moves to allowed, redirected, or signed-out state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-06-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Complete the main Kiem tra dieu kien truy cap tai khoan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "middleware/auth-server guards agree on user status and role",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "middleware/auth-server guards agree on user status and role",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-06-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Kiem tra dieu kien truy cap tai khoan",
      "preconditions": [
        "Open the UI surface for Kiem tra dieu kien truy cap tai khoan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "user sees login reason instead of a blank protected page",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "user sees login reason instead of a blank protected page",
        "Visible state matches action/query result"
      ]
    }
  ]
})
