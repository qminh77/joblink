import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-31",
  "module": "M04",
  "title": "Chia se bai viet",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/home",
  "codeEntry": "src/features/posts/api/actions.ts",
  "flow": [
    "feed/post route",
    "post component/hook",
    "post action/query",
    "post service/repo/RPC",
    "posts/comments/reactions/shares"
  ],
  "cases": [
    {
      "id": "UC-31-valid-chia-se-bai-viet",
      "kind": "valid",
      "title": "Happy path completes Chia se bai viet",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /home"
      ],
      "steps": [
        "Navigate to /home",
        "Provide valid data for postId, commentContent",
        "Submit or trigger the Chia se bai viet flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "postId, commentContent are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-31-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Chia se bai viet",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Open /home",
        "Leave one required value empty: postId, commentContent",
        "Submit or trigger the Chia se bai viet flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: postId, commentContent",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-31-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Chia se bai viet",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /home",
        "Trigger the Chia se bai viet flow",
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
      "id": "UC-31-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Chia se bai viet",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /home with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Chia se bai viet flow"
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
      "id": "UC-31-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Chia se bai viet",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Prepare boundary values for postId, commentContent",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Chia se bai viet flow"
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
      "id": "UC-31-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Chia se bai viet",
      "preconditions": [
        "The Chia se bai viet happy path has completed once"
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
      "id": "UC-31-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Chia se bai viet",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-31",
        "Route or entry point /home is reachable"
      ],
      "steps": [
        "Open /home",
        "Start the Chia se bai viet control mapped to src/features/posts/api/actions.ts",
        "Complete the flow using business data: postId, commentContent",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user shares a visible post with optional comment",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user shares a visible post with optional comment",
        "Input fields covered: postId, commentContent"
      ]
    },
    {
      "id": "UC-31-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Chia se bai viet",
      "preconditions": [
        "Actor Nguoi dung can start Chia se bai viet",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /home",
        "Use the alternate or exception business condition for Chia se bai viet",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "hidden/deleted post or overlong share comment is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "hidden/deleted post or overlong share comment is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-31-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Chia se bai viet",
      "preconditions": [
        "Record the starting state before Chia se bai viet"
      ],
      "steps": [
        "Execute Chia se bai viet",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "share creates a feed-visible shared item/count update",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "share creates a feed-visible shared item/count update",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-31-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Chia se bai viet",
      "preconditions": [
        "Complete the main Chia se bai viet path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "post_shares, share_count, and feed quote stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "post_shares, share_count, and feed quote stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-31-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Chia se bai viet",
      "preconditions": [
        "Open the UI surface for Chia se bai viet"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "share modal closes on success and displays validation errors",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "share modal closes on success and displays validation errors",
        "Visible state matches action/query result"
      ]
    }
  ]
})
