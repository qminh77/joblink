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
    }
  ]
})
