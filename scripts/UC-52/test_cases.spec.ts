import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-52",
  "module": "M07",
  "title": "Xem tin nhan va danh dau da doc",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/messages",
  "codeEntry": "src/features/messaging/api/actions.ts",
  "flow": [
    "messages/notifications UI",
    "TanStack Query hook",
    "messaging/notification action",
    "service/repository/RPC",
    "realtime/cache update"
  ],
  "cases": [
    {
      "id": "UC-52-valid-xem-tin-nhan-va-danh-dau-da-doc",
      "kind": "valid",
      "title": "Happy path completes Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /messages"
      ],
      "steps": [
        "Navigate to /messages",
        "Provide valid data for conversationId",
        "Submit or trigger the Xem tin nhan va danh dau da doc flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "conversationId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-52-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Open /messages",
        "Leave one required value empty: conversationId",
        "Submit or trigger the Xem tin nhan va danh dau da doc flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: conversationId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-52-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /messages",
        "Trigger the Xem tin nhan va danh dau da doc flow",
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
      "id": "UC-52-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /messages with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem tin nhan va danh dau da doc flow"
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
      "id": "UC-52-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Prepare boundary values for conversationId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem tin nhan va danh dau da doc flow"
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
      "id": "UC-52-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "The Xem tin nhan va danh dau da doc happy path has completed once"
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
      "id": "UC-52-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-52",
        "Route or entry point /messages is reachable"
      ],
      "steps": [
        "Open /messages",
        "Start the Xem tin nhan va danh dau da doc control mapped to src/features/messaging/api/actions.ts",
        "Complete the flow using business data: conversationId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user loads messages and marks conversation read",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user loads messages and marks conversation read",
        "Input fields covered: conversationId"
      ]
    },
    {
      "id": "UC-52-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Actor Nguoi dung can start Xem tin nhan va danh dau da doc",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /messages",
        "Use the alternate or exception business condition for Xem tin nhan va danh dau da doc",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "non-participant conversation cannot be read",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "non-participant conversation cannot be read",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-52-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Record the starting state before Xem tin nhan va danh dau da doc"
      ],
      "steps": [
        "Execute Xem tin nhan va danh dau da doc",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "unread conversation moves to read state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "unread conversation moves to read state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-52-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Complete the main Xem tin nhan va danh dau da doc path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "participant last_read_at/unread_count and navbar badge update together",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "participant last_read_at/unread_count and navbar badge update together",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-52-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem tin nhan va danh dau da doc",
      "preconditions": [
        "Open the UI surface for Xem tin nhan va danh dau da doc"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "chat panel paginates older messages and shows read state",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "chat panel paginates older messages and shows read state",
        "Visible state matches action/query result"
      ]
    }
  ]
})
