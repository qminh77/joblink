import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-19",
  "module": "M02",
  "title": "Dat CV mac dinh",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/edit",
  "codeEntry": "src/features/cvs/api/actions.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "UC-19-valid-dat-cv-mac-dinh",
      "kind": "valid",
      "title": "Happy path completes Dat CV mac dinh",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /profile/edit"
      ],
      "steps": [
        "Navigate to /profile/edit",
        "Provide valid data for cvId",
        "Submit or trigger the Dat CV mac dinh flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "cvId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-19-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dat CV mac dinh",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Open /profile/edit",
        "Leave one required value empty: cvId",
        "Submit or trigger the Dat CV mac dinh flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: cvId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-19-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dat CV mac dinh",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/edit",
        "Trigger the Dat CV mac dinh flow",
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
      "id": "UC-19-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dat CV mac dinh",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/edit with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dat CV mac dinh flow"
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
      "id": "UC-19-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dat CV mac dinh",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Prepare boundary values for cvId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dat CV mac dinh flow"
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
      "id": "UC-19-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dat CV mac dinh",
      "preconditions": [
        "The Dat CV mac dinh happy path has completed once"
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
      "id": "UC-19-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Dat CV mac dinh",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-19",
        "Route or entry point /profile/edit is reachable"
      ],
      "steps": [
        "Open /profile/edit",
        "Start the Dat CV mac dinh control mapped to src/features/cvs/api/actions.ts",
        "Complete the flow using business data: cvId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member marks exactly one saved CV as default",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member marks exactly one saved CV as default",
        "Input fields covered: cvId"
      ]
    },
    {
      "id": "UC-19-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Dat CV mac dinh",
      "preconditions": [
        "Actor Thanh vien can start Dat CV mac dinh",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/edit",
        "Use the alternate or exception business condition for Dat CV mac dinh",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid or non-owned CV cannot become default",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid or non-owned CV cannot become default",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-19-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Dat CV mac dinh",
      "preconditions": [
        "Record the starting state before Dat CV mac dinh"
      ],
      "steps": [
        "Execute Dat CV mac dinh",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "default flag moves from previous CV to selected CV",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "default flag moves from previous CV to selected CV",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-19-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Dat CV mac dinh",
      "preconditions": [
        "Complete the main Dat CV mac dinh path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "set_default_member_cv keeps a single default per user",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "set_default_member_cv keeps a single default per user",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-19-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Dat CV mac dinh",
      "preconditions": [
        "Open the UI surface for Dat CV mac dinh"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "CV card badges update immediately and do not show two defaults",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "CV card badges update immediately and do not show two defaults",
        "Visible state matches action/query result"
      ]
    }
  ]
})
