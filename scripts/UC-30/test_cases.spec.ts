import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-30",
  "module": "M04",
  "title": "Binh luan hoac xoa binh luan",
  "actor": "Nguoi dung",
  "priority": "High",
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
      "id": "UC-30-valid-binh-luan-hoac-xoa-binh-luan",
      "kind": "valid",
      "title": "Happy path completes Binh luan hoac xoa binh luan",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /home"
      ],
      "steps": [
        "Navigate to /home",
        "Provide valid data for postId, content",
        "Submit or trigger the Binh luan hoac xoa binh luan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "postId, content are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-30-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Open /home",
        "Leave one required value empty: postId, content",
        "Submit or trigger the Binh luan hoac xoa binh luan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: postId, content",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-30-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Binh luan hoac xoa binh luan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /home",
        "Trigger the Binh luan hoac xoa binh luan flow",
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
      "id": "UC-30-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /home with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Binh luan hoac xoa binh luan flow"
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
      "id": "UC-30-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Actor Nguoi dung can reach /home"
      ],
      "steps": [
        "Prepare boundary values for postId, content",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Binh luan hoac xoa binh luan flow"
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
      "id": "UC-30-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Binh luan hoac xoa binh luan",
      "preconditions": [
        "The Binh luan hoac xoa binh luan happy path has completed once"
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
      "id": "UC-30-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-30",
        "Route or entry point /home is reachable"
      ],
      "steps": [
        "Open /home",
        "Start the Binh luan hoac xoa binh luan control mapped to src/features/posts/api/actions.ts",
        "Complete the flow using business data: postId, content",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user comments on a post and deletes own comment",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user comments on a post and deletes own comment",
        "Input fields covered: postId, content"
      ]
    },
    {
      "id": "UC-30-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Actor Nguoi dung can start Binh luan hoac xoa binh luan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /home",
        "Use the alternate or exception business condition for Binh luan hoac xoa binh luan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "empty/overlong comment or hidden post is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "empty/overlong comment or hidden post is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-30-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Record the starting state before Binh luan hoac xoa binh luan"
      ],
      "steps": [
        "Execute Binh luan hoac xoa binh luan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "comment moves through created and deleted states",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "comment moves through created and deleted states",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-30-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Complete the main Binh luan hoac xoa binh luan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "post_comments and post comment_count remain synchronized",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "post_comments and post comment_count remain synchronized",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-30-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Binh luan hoac xoa binh luan",
      "preconditions": [
        "Open the UI surface for Binh luan hoac xoa binh luan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "comment thread shows submit, pagination, delete, and empty states",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "comment thread shows submit, pagination, delete, and empty states",
        "Visible state matches action/query result"
      ]
    }
  ]
})
