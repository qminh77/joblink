import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-01",
  "module": "M01",
  "title": "Dang ky tai khoan ca nhan",
  "actor": "Khach",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/register",
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
      "id": "UC-01-valid-dang-ky-tai-khoan-ca-nhan",
      "kind": "valid",
      "title": "Happy path completes Dang ky tai khoan ca nhan",
      "preconditions": [
        "Actor Khach has the correct starting state",
        "Open /register"
      ],
      "steps": [
        "Navigate to /register",
        "Provide valid data for fullName, email, password, termsAccepted",
        "Submit or trigger the Dang ky tai khoan ca nhan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "fullName, email, password, termsAccepted are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-01-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Actor Khach can reach /register"
      ],
      "steps": [
        "Open /register",
        "Leave one required value empty: fullName, email, password, termsAccepted",
        "Submit or trigger the Dang ky tai khoan ca nhan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: fullName, email, password, termsAccepted",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-01-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dang ky tai khoan ca nhan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /register",
        "Trigger the Dang ky tai khoan ca nhan flow",
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
      "id": "UC-01-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /register with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dang ky tai khoan ca nhan flow"
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
      "id": "UC-01-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Actor Khach can reach /register"
      ],
      "steps": [
        "Prepare boundary values for fullName, email, password, termsAccepted",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dang ky tai khoan ca nhan flow"
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
      "id": "UC-01-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dang ky tai khoan ca nhan",
      "preconditions": [
        "The Dang ky tai khoan ca nhan happy path has completed once"
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
      "id": "UC-01-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Actor Khach matches the SRS actor for UC-01",
        "Route or entry point /register is reachable"
      ],
      "steps": [
        "Open /register",
        "Start the Dang ky tai khoan ca nhan control mapped to src/features/auth/api/auth-actions.ts",
        "Complete the flow using business data: fullName, email, password, termsAccepted",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member account is created with role member and verification email is requested",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member account is created with role member and verification email is requested",
        "Input fields covered: fullName, email, password, termsAccepted"
      ]
    },
    {
      "id": "UC-01-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Actor Khach can start Dang ky tai khoan ca nhan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /register",
        "Use the alternate or exception business condition for Dang ky tai khoan ca nhan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "duplicate email, weak password, or missing terms is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "duplicate email, weak password, or missing terms is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-01-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Record the starting state before Dang ky tai khoan ca nhan"
      ],
      "steps": [
        "Execute Dang ky tai khoan ca nhan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "guest state moves to registered account waiting for email verification",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "guest state moves to registered account waiting for email verification",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-01-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Complete the main Dang ky tai khoan ca nhan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Supabase Auth user and public.users mirror are created consistently",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Supabase Auth user and public.users mirror are created consistently",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-01-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Dang ky tai khoan ca nhan",
      "preconditions": [
        "Open the UI surface for Dang ky tai khoan ca nhan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "register form keeps safe input and highlights invalid required fields",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "register form keeps safe input and highlights invalid required fields",
        "Visible state matches action/query result"
      ]
    }
  ]
})
