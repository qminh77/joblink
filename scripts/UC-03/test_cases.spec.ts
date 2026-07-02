import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-03",
  "module": "M01",
  "title": "Xac minh email dang ky",
  "actor": "Khach, Dich vu Email",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/auth/callback",
  "codeEntry": "src/app/auth/callback/route.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-03-valid-xac-minh-email-dang-ky",
      "kind": "valid",
      "title": "Happy path completes Xac minh email dang ky",
      "preconditions": [
        "Actor Khach, Dich vu Email has the correct starting state",
        "Open /auth/callback"
      ],
      "steps": [
        "Navigate to /auth/callback",
        "Provide valid data for code",
        "Submit or trigger the Xac minh email dang ky flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "code are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-03-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xac minh email dang ky",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /auth/callback"
      ],
      "steps": [
        "Open /auth/callback",
        "Leave one required value empty: code",
        "Submit or trigger the Xac minh email dang ky flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: code",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-03-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xac minh email dang ky",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /auth/callback",
        "Trigger the Xac minh email dang ky flow",
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
      "id": "UC-03-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xac minh email dang ky",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /auth/callback with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xac minh email dang ky flow"
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
      "id": "UC-03-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xac minh email dang ky",
      "preconditions": [
        "Actor Khach, Dich vu Email can reach /auth/callback"
      ],
      "steps": [
        "Prepare boundary values for code",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xac minh email dang ky flow"
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
      "id": "UC-03-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xac minh email dang ky",
      "preconditions": [
        "The Xac minh email dang ky happy path has completed once"
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
      "id": "UC-03-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xac minh email dang ky",
      "preconditions": [
        "Actor Khach, Dich vu Email matches the SRS actor for UC-03",
        "Route or entry point /auth/callback is reachable"
      ],
      "steps": [
        "Open /auth/callback",
        "Start the Xac minh email dang ky control mapped to src/app/auth/callback/route.ts",
        "Complete the flow using business data: code",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "valid email verification callback exchanges code and activates email session/state",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "valid email verification callback exchanges code and activates email session/state",
        "Input fields covered: code"
      ]
    },
    {
      "id": "UC-03-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xac minh email dang ky",
      "preconditions": [
        "Actor Khach, Dich vu Email can start Xac minh email dang ky",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /auth/callback",
        "Use the alternate or exception business condition for Xac minh email dang ky",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "expired, reused, or malformed code redirects to a safe login error",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "expired, reused, or malformed code redirects to a safe login error",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-03-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xac minh email dang ky",
      "preconditions": [
        "Record the starting state before Xac minh email dang ky"
      ],
      "steps": [
        "Execute Xac minh email dang ky",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "unverified account moves to verified email state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "unverified account moves to verified email state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-03-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xac minh email dang ky",
      "preconditions": [
        "Complete the main Xac minh email dang ky path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Supabase callback and app redirect target stay aligned",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Supabase callback and app redirect target stay aligned",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-03-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xac minh email dang ky",
      "preconditions": [
        "Open the UI surface for Xac minh email dang ky"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "callback page/redirect gives clear success or failure feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "callback page/redirect gives clear success or failure feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
