import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-33",
  "module": "M04",
  "title": "Xem chi tiet bai viet",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/posts/[id]",
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
      "id": "UC-33-valid-xem-chi-tiet-bai-viet",
      "kind": "valid",
      "title": "Happy path completes Xem chi tiet bai viet",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /posts/[id]"
      ],
      "steps": [
        "Navigate to /posts/[id]",
        "Provide valid data for postId",
        "Submit or trigger the Xem chi tiet bai viet flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "postId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-33-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem chi tiet bai viet",
      "preconditions": [
        "Actor Nguoi dung can reach /posts/[id]"
      ],
      "steps": [
        "Open /posts/[id]",
        "Leave one required value empty: postId",
        "Submit or trigger the Xem chi tiet bai viet flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: postId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-33-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem chi tiet bai viet",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /posts/[id]",
        "Trigger the Xem chi tiet bai viet flow",
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
      "id": "UC-33-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem chi tiet bai viet",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /posts/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem chi tiet bai viet flow"
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
      "id": "UC-33-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem chi tiet bai viet",
      "preconditions": [
        "Actor Nguoi dung can reach /posts/[id]"
      ],
      "steps": [
        "Prepare boundary values for postId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem chi tiet bai viet flow"
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
      "id": "UC-33-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem chi tiet bai viet",
      "preconditions": [
        "The Xem chi tiet bai viet happy path has completed once"
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
      "id": "UC-33-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem chi tiet bai viet",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-33",
        "Route or entry point /posts/[id] is reachable"
      ],
      "steps": [
        "Open /posts/[id]",
        "Start the Xem chi tiet bai viet control mapped to src/features/posts/api/queries.ts",
        "Complete the flow using business data: postId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user opens a post detail page with comments and engagement",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user opens a post detail page with comments and engagement",
        "Input fields covered: postId"
      ]
    },
    {
      "id": "UC-33-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem chi tiet bai viet",
      "preconditions": [
        "Actor Nguoi dung can start Xem chi tiet bai viet",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /posts/[id]",
        "Use the alternate or exception business condition for Xem chi tiet bai viet",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "not-found, deleted, or private post is hidden safely",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "not-found, deleted, or private post is hidden safely",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-33-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem chi tiet bai viet",
      "preconditions": [
        "Record the starting state before Xem chi tiet bai viet"
      ],
      "steps": [
        "Execute Xem chi tiet bai viet",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "post detail moves to loaded or not-found/forbidden state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "post detail moves to loaded or not-found/forbidden state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-33-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem chi tiet bai viet",
      "preconditions": [
        "Complete the main Xem chi tiet bai viet path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "detail query, comments query, and engagement state agree",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "detail query, comments query, and engagement state agree",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-33-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem chi tiet bai viet",
      "preconditions": [
        "Open the UI surface for Xem chi tiet bai viet"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "detail page renders skeleton, comments, and action availability",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "detail page renders skeleton, comments, and action availability",
        "Visible state matches action/query result"
      ]
    }
  ]
})
