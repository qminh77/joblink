import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-51",
  "module": "M07",
  "title": "Gui tin nhan",
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
      "id": "UC-51-valid-gui-tin-nhan",
      "kind": "valid",
      "title": "Happy path completes Gui tin nhan",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /messages"
      ],
      "steps": [
        "Navigate to /messages",
        "Provide valid data for conversationId, content",
        "Submit or trigger the Gui tin nhan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "conversationId, content are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-51-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Gui tin nhan",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Open /messages",
        "Leave one required value empty: conversationId, content",
        "Submit or trigger the Gui tin nhan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: conversationId, content",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-51-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Gui tin nhan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /messages",
        "Trigger the Gui tin nhan flow",
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
      "id": "UC-51-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Gui tin nhan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /messages with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Gui tin nhan flow"
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
      "id": "UC-51-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Gui tin nhan",
      "preconditions": [
        "Actor Nguoi dung can reach /messages"
      ],
      "steps": [
        "Prepare boundary values for conversationId, content",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Gui tin nhan flow"
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
      "id": "UC-51-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Gui tin nhan",
      "preconditions": [
        "The Gui tin nhan happy path has completed once"
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
      "id": "UC-51-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Gui tin nhan",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-51",
        "Route or entry point /messages is reachable"
      ],
      "steps": [
        "Open /messages",
        "Start the Gui tin nhan control mapped to src/features/messaging/api/actions.ts",
        "Complete the flow using business data: conversationId, content",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user sends a text message in a conversation",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user sends a text message in a conversation",
        "Input fields covered: conversationId, content"
      ]
    },
    {
      "id": "UC-51-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Gui tin nhan",
      "preconditions": [
        "Actor Nguoi dung can start Gui tin nhan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /messages",
        "Use the alternate or exception business condition for Gui tin nhan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "empty/overlong message, non-participant, or blocked relation is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "empty/overlong message, non-participant, or blocked relation is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-51-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Gui tin nhan",
      "preconditions": [
        "Record the starting state before Gui tin nhan"
      ],
      "steps": [
        "Execute Gui tin nhan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "message state moves to sent and conversation last message updates",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "message state moves to sent and conversation last message updates",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-51-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Gui tin nhan",
      "preconditions": [
        "Complete the main Gui tin nhan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "messages table, conversation summary, unread counter, and realtime event stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "messages table, conversation summary, unread counter, and realtime event stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-51-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Gui tin nhan",
      "preconditions": [
        "Open the UI surface for Gui tin nhan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "chat input clears on success and preserves message on failure",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "chat input clears on success and preserves message on failure",
        "Visible state matches action/query result"
      ]
    }
  ]
})
