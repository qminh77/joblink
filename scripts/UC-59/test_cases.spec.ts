import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-59",
  "module": "M08",
  "title": "Xem tai khoan da chan va bo chan",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
  "codeEntry": "src/features/settings/components/blocked-accounts-card.tsx",
  "flow": [
    "settings/report UI",
    "settings/report hook",
    "settings/report action",
    "service/repository",
    "users/preferences/reports"
  ],
  "cases": [
    {
      "id": "UC-59-valid-xem-tai-khoan-da-chan-va-bo-chan",
      "kind": "valid",
      "title": "Happy path completes Xem tai khoan da chan va bo chan",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /settings"
      ],
      "steps": [
        "Navigate to /settings",
        "Provide valid data for blockedUserId",
        "Submit or trigger the Xem tai khoan da chan va bo chan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "blockedUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-59-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem tai khoan da chan va bo chan",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Open /settings",
        "Leave one required value empty: blockedUserId",
        "Submit or trigger the Xem tai khoan da chan va bo chan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: blockedUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-59-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem tai khoan da chan va bo chan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /settings",
        "Trigger the Xem tai khoan da chan va bo chan flow",
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
      "id": "UC-59-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem tai khoan da chan va bo chan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem tai khoan da chan va bo chan flow"
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
      "id": "UC-59-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem tai khoan da chan va bo chan",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Prepare boundary values for blockedUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem tai khoan da chan va bo chan flow"
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
      "id": "UC-59-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem tai khoan da chan va bo chan",
      "preconditions": [
        "The Xem tai khoan da chan va bo chan happy path has completed once"
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
