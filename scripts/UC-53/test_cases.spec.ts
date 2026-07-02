import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-53",
  "module": "M07",
  "title": "Xem thong bao",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/notifications",
  "codeEntry": "src/features/notifications/api/queries.ts",
  "flow": [
    "messages/notifications UI",
    "TanStack Query hook",
    "messaging/notification action",
    "service/repository/RPC",
    "realtime/cache update"
  ],
  "cases": [
    {
      "id": "UC-53-valid-xem-thong-bao",
      "kind": "valid",
      "title": "Happy path completes Xem thong bao",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /notifications"
      ],
      "steps": [
        "Navigate to /notifications",
        "Provide valid data for cursor",
        "Submit or trigger the Xem thong bao flow",
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
      "id": "UC-53-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem thong bao",
      "preconditions": [
        "Actor Nguoi dung can reach /notifications"
      ],
      "steps": [
        "Open /notifications",
        "Leave one required value empty: cursor",
        "Submit or trigger the Xem thong bao flow"
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
      "id": "UC-53-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem thong bao",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /notifications",
        "Trigger the Xem thong bao flow",
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
      "id": "UC-53-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem thong bao",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /notifications with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem thong bao flow"
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
      "id": "UC-53-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem thong bao",
      "preconditions": [
        "Actor Nguoi dung can reach /notifications"
      ],
      "steps": [
        "Prepare boundary values for cursor",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem thong bao flow"
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
      "id": "UC-53-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem thong bao",
      "preconditions": [
        "The Xem thong bao happy path has completed once"
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
      "id": "UC-53-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem thong bao",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-53",
        "Route or entry point /notifications is reachable"
      ],
      "steps": [
        "Open /notifications",
        "Start the Xem thong bao control mapped to src/features/notifications/api/queries.ts",
        "Complete the flow using business data: cursor",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user views paged notifications and unread count",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user views paged notifications and unread count",
        "Input fields covered: cursor"
      ]
    },
    {
      "id": "UC-53-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem thong bao",
      "preconditions": [
        "Actor Nguoi dung can start Xem thong bao",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /notifications",
        "Use the alternate or exception business condition for Xem thong bao",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid cursor or another user's notification data is rejected/hidden",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid cursor or another user's notification data is rejected/hidden",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-53-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem thong bao",
      "preconditions": [
        "Record the starting state before Xem thong bao"
      ],
      "steps": [
        "Execute Xem thong bao",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "notification list moves through initial page and load-more state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "notification list moves through initial page and load-more state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-53-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem thong bao",
      "preconditions": [
        "Complete the main Xem thong bao path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "notifications query, unread count, and realtime updates stay aligned",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "notifications query, unread count, and realtime updates stay aligned",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-53-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem thong bao",
      "preconditions": [
        "Open the UI surface for Xem thong bao"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "notification list shows skeleton, empty state, unread badge, and target links",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "notification list shows skeleton, empty state, unread badge, and target links",
        "Visible state matches action/query result"
      ]
    }
  ]
})
