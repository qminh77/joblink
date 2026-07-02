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
    }
  ]
})
