import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-17",
  "module": "M02",
  "title": "Tao CV tu ho so",
  "actor": "Thanh vien",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/profile/edit",
  "codeEntry": "src/features/cvs/api/actions.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "UC-17-valid-tao-cv-tu-ho-so",
      "kind": "valid",
      "title": "Happy path completes Tao CV tu ho so",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /profile/edit"
      ],
      "steps": [
        "Navigate to /profile/edit",
        "Provide valid data for profileData, builderConfig",
        "Submit or trigger the Tao CV tu ho so flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "profileData, builderConfig are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-17-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Tao CV tu ho so",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Open /profile/edit",
        "Leave one required value empty: profileData, builderConfig",
        "Submit or trigger the Tao CV tu ho so flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: profileData, builderConfig",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-17-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Tao CV tu ho so",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/edit",
        "Trigger the Tao CV tu ho so flow",
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
      "id": "UC-17-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Tao CV tu ho so",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/edit with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Tao CV tu ho so flow"
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
      "id": "UC-17-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Tao CV tu ho so",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Prepare boundary values for profileData, builderConfig",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Tao CV tu ho so flow"
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
      "id": "UC-17-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Tao CV tu ho so",
      "preconditions": [
        "The Tao CV tu ho so happy path has completed once"
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
