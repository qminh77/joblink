import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-55",
  "module": "M07",
  "title": "Cap nhat lua chon nhan thong bao",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
  "codeEntry": "src/features/notifications/api/actions.ts",
  "flow": [
    "messages/notifications UI",
    "TanStack Query hook",
    "messaging/notification action",
    "service/repository/RPC",
    "realtime/cache update"
  ],
  "cases": [
    {
      "id": "UC-55-valid-cap-nhat-lua-chon-nhan-thong-bao",
      "kind": "valid",
      "title": "Happy path completes Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /settings"
      ],
      "steps": [
        "Navigate to /settings",
        "Provide valid data for category, channel, enabled",
        "Submit or trigger the Cap nhat lua chon nhan thong bao flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "category, channel, enabled are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-55-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Open /settings",
        "Leave one required value empty: category, channel, enabled",
        "Submit or trigger the Cap nhat lua chon nhan thong bao flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: category, channel, enabled",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-55-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /settings",
        "Trigger the Cap nhat lua chon nhan thong bao flow",
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
      "id": "UC-55-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Cap nhat lua chon nhan thong bao flow"
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
      "id": "UC-55-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Prepare boundary values for category, channel, enabled",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Cap nhat lua chon nhan thong bao flow"
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
      "id": "UC-55-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "The Cap nhat lua chon nhan thong bao happy path has completed once"
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
      "id": "UC-55-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-55",
        "Route or entry point /settings is reachable"
      ],
      "steps": [
        "Open /settings",
        "Start the Cap nhat lua chon nhan thong bao control mapped to src/features/notifications/api/actions.ts",
        "Complete the flow using business data: category, channel, enabled",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user updates notification preferences per category/channel",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user updates notification preferences per category/channel",
        "Input fields covered: category, channel, enabled"
      ]
    },
    {
      "id": "UC-55-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Actor Nguoi dung can start Cap nhat lua chon nhan thong bao",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /settings",
        "Use the alternate or exception business condition for Cap nhat lua chon nhan thong bao",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "unknown category/channel or invalid boolean payload is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "unknown category/channel or invalid boolean payload is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-55-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Record the starting state before Cap nhat lua chon nhan thong bao"
      ],
      "steps": [
        "Execute Cap nhat lua chon nhan thong bao",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "preference state moves to selected enabled/disabled value",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "preference state moves to selected enabled/disabled value",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-55-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Complete the main Cap nhat lua chon nhan thong bao path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "notification creation respects in-app/email preferences for later events",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "notification creation respects in-app/email preferences for later events",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-55-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Cap nhat lua chon nhan thong bao",
      "preconditions": [
        "Open the UI surface for Cap nhat lua chon nhan thong bao"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "settings preference switches show loading and saved state",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "settings preference switches show loading and saved state",
        "Visible state matches action/query result"
      ]
    }
  ]
})
