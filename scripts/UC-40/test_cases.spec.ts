import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-40",
  "module": "M05",
  "title": "Chan hoac bo chan nguoi dung",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/[id]|/settings",
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
      "id": "UC-40-valid-chan-hoac-bo-chan-nguoi-dung",
      "kind": "valid",
      "title": "Happy path completes Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /profile/[id]|/settings"
      ],
      "steps": [
        "Navigate to /profile/[id]|/settings",
        "Provide valid data for targetUserId",
        "Submit or trigger the Chan hoac bo chan nguoi dung flow",
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
      "id": "UC-40-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]|/settings"
      ],
      "steps": [
        "Open /profile/[id]|/settings",
        "Leave one required value empty: targetUserId",
        "Submit or trigger the Chan hoac bo chan nguoi dung flow"
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
      "id": "UC-40-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/[id]|/settings",
        "Trigger the Chan hoac bo chan nguoi dung flow",
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
      "id": "UC-40-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/[id]|/settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Chan hoac bo chan nguoi dung flow"
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
      "id": "UC-40-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]|/settings"
      ],
      "steps": [
        "Prepare boundary values for targetUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Chan hoac bo chan nguoi dung flow"
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
      "id": "UC-40-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "The Chan hoac bo chan nguoi dung happy path has completed once"
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
      "id": "UC-40-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-40",
        "Route or entry point /profile/[id]|/settings is reachable"
      ],
      "steps": [
        "Open /profile/[id]|/settings",
        "Start the Chan hoac bo chan nguoi dung control mapped to src/features/network/api/actions.ts",
        "Complete the flow using business data: targetUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user blocks and unblocks another user",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user blocks and unblocks another user",
        "Input fields covered: targetUserId"
      ]
    },
    {
      "id": "UC-40-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can start Chan hoac bo chan nguoi dung",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/[id]|/settings",
        "Use the alternate or exception business condition for Chan hoac bo chan nguoi dung",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "self-block or invalid target is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "self-block or invalid target is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-40-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Record the starting state before Chan hoac bo chan nguoi dung"
      ],
      "steps": [
        "Execute Chan hoac bo chan nguoi dung",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "relationship moves to blocked and later unblocked state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "relationship moves to blocked and later unblocked state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-40-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Complete the main Chan hoac bo chan nguoi dung path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "block removes/invalidates connection, follow, messaging, and suggestion access",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "block removes/invalidates connection, follow, messaging, and suggestion access",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-40-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Chan hoac bo chan nguoi dung",
      "preconditions": [
        "Open the UI surface for Chan hoac bo chan nguoi dung"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "profile/settings UI shows blocked state and unblock entry point",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "profile/settings UI shows blocked state and unblock entry point",
        "Visible state matches action/query result"
      ]
    }
  ]
})
