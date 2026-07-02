import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-35",
  "module": "M05",
  "title": "Xem goi y ket noi",
  "actor": "Nguoi dung",
  "priority": "Medium",
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
      "id": "UC-35-valid-xem-goi-y-ket-noi",
      "kind": "valid",
      "title": "Happy path completes Xem goi y ket noi",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /network"
      ],
      "steps": [
        "Navigate to /network",
        "Provide valid data for currentUserId",
        "Submit or trigger the Xem goi y ket noi flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "currentUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-35-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem goi y ket noi",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Open /network",
        "Leave one required value empty: currentUserId",
        "Submit or trigger the Xem goi y ket noi flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: currentUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-35-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem goi y ket noi",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /network",
        "Trigger the Xem goi y ket noi flow",
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
      "id": "UC-35-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem goi y ket noi",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /network with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem goi y ket noi flow"
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
      "id": "UC-35-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem goi y ket noi",
      "preconditions": [
        "Actor Nguoi dung can reach /network"
      ],
      "steps": [
        "Prepare boundary values for currentUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem goi y ket noi flow"
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
      "id": "UC-35-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem goi y ket noi",
      "preconditions": [
        "The Xem goi y ket noi happy path has completed once"
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
      "id": "UC-35-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem goi y ket noi",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-35",
        "Route or entry point /network is reachable"
      ],
      "steps": [
        "Open /network",
        "Start the Xem goi y ket noi control mapped to src/features/network/api/actions.ts",
        "Complete the flow using business data: currentUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user sees connection suggestions and network overview",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user sees connection suggestions and network overview",
        "Input fields covered: currentUserId"
      ]
    },
    {
      "id": "UC-35-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem goi y ket noi",
      "preconditions": [
        "Actor Nguoi dung can start Xem goi y ket noi",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /network",
        "Use the alternate or exception business condition for Xem goi y ket noi",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "blocked users or existing connections are excluded from suggestions",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "blocked users or existing connections are excluded from suggestions",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-35-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem goi y ket noi",
      "preconditions": [
        "Record the starting state before Xem goi y ket noi"
      ],
      "steps": [
        "Execute Xem goi y ket noi",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "suggestion list moves from generated to dismissed/acted-on state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "suggestion list moves from generated to dismissed/acted-on state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-35-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem goi y ket noi",
      "preconditions": [
        "Complete the main Xem goi y ket noi path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "suggestion RPC and connection relation state stay aligned",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "suggestion RPC and connection relation state stay aligned",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-35-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem goi y ket noi",
      "preconditions": [
        "Open the UI surface for Xem goi y ket noi"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "network page shows requests, connections, suggestions, and empty states",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "network page shows requests, connections, suggestions, and empty states",
        "Visible state matches action/query result"
      ]
    }
  ]
})
