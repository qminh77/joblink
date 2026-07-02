import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-05",
  "module": "M01",
  "title": "Dang nhap bang Google",
  "actor": "Khach, Google OAuth",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/login",
  "codeEntry": "src/features/auth/components/google-sign-in-button.tsx",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-05-valid-dang-nhap-bang-google",
      "kind": "valid",
      "title": "Happy path completes Dang nhap bang Google",
      "preconditions": [
        "Actor Khach, Google OAuth has the correct starting state",
        "Open /login"
      ],
      "steps": [
        "Navigate to /login",
        "Provide valid data for provider, redirectTo",
        "Submit or trigger the Dang nhap bang Google flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "provider, redirectTo are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-05-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dang nhap bang Google",
      "preconditions": [
        "Actor Khach, Google OAuth can reach /login"
      ],
      "steps": [
        "Open /login",
        "Leave one required value empty: provider, redirectTo",
        "Submit or trigger the Dang nhap bang Google flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: provider, redirectTo",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-05-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dang nhap bang Google",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /login",
        "Trigger the Dang nhap bang Google flow",
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
      "id": "UC-05-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dang nhap bang Google",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /login with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dang nhap bang Google flow"
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
      "id": "UC-05-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dang nhap bang Google",
      "preconditions": [
        "Actor Khach, Google OAuth can reach /login"
      ],
      "steps": [
        "Prepare boundary values for provider, redirectTo",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dang nhap bang Google flow"
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
      "id": "UC-05-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dang nhap bang Google",
      "preconditions": [
        "The Dang nhap bang Google happy path has completed once"
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
