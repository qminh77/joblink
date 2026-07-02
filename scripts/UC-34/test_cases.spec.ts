import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-34",
  "module": "M05",
  "title": "Tim kiem tong hop",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/search",
  "codeEntry": "src/features/search/api/actions.ts",
  "flow": [
    "network/search/profile UI",
    "network/search hooks",
    "network/search action",
    "service/repository/RPC",
    "connections/follows/blocks/search data"
  ],
  "cases": [
    {
      "id": "UC-34-valid-tim-kiem-tong-hop",
      "kind": "valid",
      "title": "Happy path completes Tim kiem tong hop",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /search"
      ],
      "steps": [
        "Navigate to /search",
        "Provide valid data for query",
        "Submit or trigger the Tim kiem tong hop flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "query are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-34-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Tim kiem tong hop",
      "preconditions": [
        "Actor Nguoi dung can reach /search"
      ],
      "steps": [
        "Open /search",
        "Leave one required value empty: query",
        "Submit or trigger the Tim kiem tong hop flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: query",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-34-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Tim kiem tong hop",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /search",
        "Trigger the Tim kiem tong hop flow",
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
      "id": "UC-34-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Tim kiem tong hop",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /search with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Tim kiem tong hop flow"
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
      "id": "UC-34-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Tim kiem tong hop",
      "preconditions": [
        "Actor Nguoi dung can reach /search"
      ],
      "steps": [
        "Prepare boundary values for query",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Tim kiem tong hop flow"
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
      "id": "UC-34-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Tim kiem tong hop",
      "preconditions": [
        "The Tim kiem tong hop happy path has completed once"
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
      "id": "UC-34-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Tim kiem tong hop",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-34",
        "Route or entry point /search is reachable"
      ],
      "steps": [
        "Open /search",
        "Start the Tim kiem tong hop control mapped to src/features/search/api/actions.ts",
        "Complete the flow using business data: query",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user searches across people, companies, posts, and jobs",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user searches across people, companies, posts, and jobs",
        "Input fields covered: query"
      ]
    },
    {
      "id": "UC-34-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Tim kiem tong hop",
      "preconditions": [
        "Actor Nguoi dung can start Tim kiem tong hop",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /search",
        "Use the alternate or exception business condition for Tim kiem tong hop",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "blank query or unsupported filters return validation/empty result",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "blank query or unsupported filters return validation/empty result",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-34-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Tim kiem tong hop",
      "preconditions": [
        "Record the starting state before Tim kiem tong hop"
      ],
      "steps": [
        "Execute Tim kiem tong hop",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "search state moves through all tab and filtered tab results",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "search state moves through all tab and filtered tab results",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-34-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Tim kiem tong hop",
      "preconditions": [
        "Complete the main Tim kiem tong hop path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "search repos aggregate result counts without leaking private content",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "search repos aggregate result counts without leaking private content",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-34-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Tim kiem tong hop",
      "preconditions": [
        "Open the UI surface for Tim kiem tong hop"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "search page shows loading, tabs, no results, and filter feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "search page shows loading, tabs, no results, and filter feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
