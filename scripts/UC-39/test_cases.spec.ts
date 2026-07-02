import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-39",
  "module": "M05",
  "title": "Theo doi hoac bo theo doi nguoi dung",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/profile/[id]",
  "codeEntry": "src/features/network/api/actions.ts",
  "flow": [
    "network/search/profile UI",
    "network/search hooks",
    "network/search action",
    "service/repository/RPC",
    "connections/follows/blocks/search data"
  ],
  "cases": [
    {
      "id": "UC-39-valid-theo-doi-hoac-bo-theo-doi-nguoi-dung",
      "kind": "valid",
      "title": "Happy path completes Theo doi hoac bo theo doi nguoi dung",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /profile/[id]"
      ],
      "steps": [
        "Navigate to /profile/[id]",
        "Provide valid data for targetUserId",
        "Submit or trigger the Theo doi hoac bo theo doi nguoi dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "targetUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-39-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Theo doi hoac bo theo doi nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]"
      ],
      "steps": [
        "Open /profile/[id]",
        "Leave one required value empty: targetUserId",
        "Submit or trigger the Theo doi hoac bo theo doi nguoi dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: targetUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-39-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Theo doi hoac bo theo doi nguoi dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/[id]",
        "Trigger the Theo doi hoac bo theo doi nguoi dung flow",
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
      "id": "UC-39-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Theo doi hoac bo theo doi nguoi dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Theo doi hoac bo theo doi nguoi dung flow"
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
      "id": "UC-39-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Theo doi hoac bo theo doi nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]"
      ],
      "steps": [
        "Prepare boundary values for targetUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Theo doi hoac bo theo doi nguoi dung flow"
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
      "id": "UC-39-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Theo doi hoac bo theo doi nguoi dung",
      "preconditions": [
        "The Theo doi hoac bo theo doi nguoi dung happy path has completed once"
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
