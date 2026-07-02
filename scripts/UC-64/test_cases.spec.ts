import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-64",
  "module": "M09",
  "title": "Kiem duyet bai viet",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/posts",
  "codeEntry": "src/features/admin/api/posts.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-64-valid-kiem-duyet-bai-viet",
      "kind": "valid",
      "title": "Happy path completes Kiem duyet bai viet",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/posts"
      ],
      "steps": [
        "Navigate to /admin/posts",
        "Provide valid data for postId, action",
        "Submit or trigger the Kiem duyet bai viet flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "postId, action are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-64-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Kiem duyet bai viet",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/posts"
      ],
      "steps": [
        "Open /admin/posts",
        "Leave one required value empty: postId, action",
        "Submit or trigger the Kiem duyet bai viet flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: postId, action",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-64-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Kiem duyet bai viet",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/posts",
        "Trigger the Kiem duyet bai viet flow",
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
      "id": "UC-64-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Kiem duyet bai viet",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/posts with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Kiem duyet bai viet flow"
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
      "id": "UC-64-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Kiem duyet bai viet",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/posts"
      ],
      "steps": [
        "Prepare boundary values for postId, action",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Kiem duyet bai viet flow"
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
      "id": "UC-64-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Kiem duyet bai viet",
      "preconditions": [
        "The Kiem duyet bai viet happy path has completed once"
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
