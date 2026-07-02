import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-26",
  "module": "M04",
  "title": "Xem bang tin",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/home",
  "codeEntry": "src/features/posts/api/queries.ts",
  "flow": [
    "feed/post route",
    "post component/hook",
    "post action/query",
    "post service/repo/RPC",
    "posts/comments/reactions/shares"
  ],
  "cases": [
    {
      "id": "UC-26-valid-xem-bang-tin",
      "kind": "valid",
      "title": "Happy path completes Xem bang tin",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /home"
      ],
      "steps": [
        "Navigate to /home",
        "Provide valid data for cursor",
        "Submit or trigger the Xem bang tin flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "cursor are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-26-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem bang tin",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Open /home",
        "Leave one required value empty: cursor",
        "Submit or trigger the Xem bang tin flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: cursor",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-26-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem bang tin",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /home",
        "Trigger the Xem bang tin flow",
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
      "id": "UC-26-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem bang tin",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /home with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem bang tin flow"
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
      "id": "UC-26-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem bang tin",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Prepare boundary values for cursor",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem bang tin flow"
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
      "id": "UC-26-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem bang tin",
      "preconditions": [
        "The Xem bang tin happy path has completed once"
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
      "id": "UC-26-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem bang tin",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-26",
        "Route or entry point /home is reachable"
      ],
      "steps": [
        "Open /home",
        "Start the Xem bang tin control mapped to src/features/posts/api/queries.ts",
        "Complete the flow using business data: cursor",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user loads paged home feed with visible posts",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user loads paged home feed with visible posts",
        "Input fields covered: cursor"
      ]
    },
    {
      "id": "UC-26-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem bang tin",
      "preconditions": [
        "Actor Nguoi dung can start Xem bang tin",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /home",
        "Use the alternate or exception business condition for Xem bang tin",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "blocked/private/deleted posts are excluded",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "blocked/private/deleted posts are excluded",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-26-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem bang tin",
      "preconditions": [
        "Record the starting state before Xem bang tin"
      ],
      "steps": [
        "Execute Xem bang tin",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "feed cursor moves from first page to next page",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "feed cursor moves from first page to next page",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-26-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem bang tin",
      "preconditions": [
        "Complete the main Xem bang tin path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "feed RPC respects visibility, connections, and pagination",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "feed RPC respects visibility, connections, and pagination",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-26-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem bang tin",
      "preconditions": [
        "Open the UI surface for Xem bang tin"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "feed shows skeleton, empty state, and load-more state",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "feed shows skeleton, empty state, and load-more state",
        "Visible state matches action/query result"
      ]
    }
  ]
})
