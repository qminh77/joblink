import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-36",
  "module": "M05",
  "title": "Gui hoac huy loi moi ket noi",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/network",
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
      "id": "UC-36-valid-gui-hoac-huy-loi-moi-ket-noi",
      "kind": "valid",
      "title": "Happy path completes Gui hoac huy loi moi ket noi",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /network"
      ],
      "steps": [
        "Navigate to /network",
        "Provide valid data for targetUserId",
        "Submit or trigger the Gui hoac huy loi moi ket noi flow",
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
      "id": "UC-36-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Gui hoac huy loi moi ket noi",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Open /network",
        "Leave one required value empty: targetUserId",
        "Submit or trigger the Gui hoac huy loi moi ket noi flow"
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
      "id": "UC-36-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Gui hoac huy loi moi ket noi",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /network",
        "Trigger the Gui hoac huy loi moi ket noi flow",
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
      "id": "UC-36-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Gui hoac huy loi moi ket noi",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /network with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Gui hoac huy loi moi ket noi flow"
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
      "id": "UC-36-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Gui hoac huy loi moi ket noi",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Prepare boundary values for targetUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Gui hoac huy loi moi ket noi flow"
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
      "id": "UC-36-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Gui hoac huy loi moi ket noi",
      "preconditions": [
        "The Gui hoac huy loi moi ket noi happy path has completed once"
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
