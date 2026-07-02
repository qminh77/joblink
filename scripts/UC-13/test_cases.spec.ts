import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-13",
  "module": "M02",
  "title": "Quan ly ky nang nghe nghiep",
  "actor": "Thanh vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/edit",
  "codeEntry": "src/features/profile/api/actions.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "UC-13-valid-quan-ly-ky-nang-nghe-nghiep",
      "kind": "valid",
      "title": "Happy path completes Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /profile/edit"
      ],
      "steps": [
        "Navigate to /profile/edit",
        "Provide valid data for skillName",
        "Submit or trigger the Quan ly ky nang nghe nghiep flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "skillName are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-13-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Open /profile/edit",
        "Leave one required value empty: skillName",
        "Submit or trigger the Quan ly ky nang nghe nghiep flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: skillName",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-13-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/edit",
        "Trigger the Quan ly ky nang nghe nghiep flow",
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
      "id": "UC-13-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/edit with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Quan ly ky nang nghe nghiep flow"
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
      "id": "UC-13-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Prepare boundary values for skillName",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Quan ly ky nang nghe nghiep flow"
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
      "id": "UC-13-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "The Quan ly ky nang nghe nghiep happy path has completed once"
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
      "id": "UC-13-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-13",
        "Route or entry point /profile/edit is reachable"
      ],
      "steps": [
        "Open /profile/edit",
        "Start the Quan ly ky nang nghe nghiep control mapped to src/features/profile/api/actions.ts",
        "Complete the flow using business data: skillName",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member can add and remove professional skills",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member can add and remove professional skills",
        "Input fields covered: skillName"
      ]
    },
    {
      "id": "UC-13-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Actor Thanh vien can start Quan ly ky nang nghe nghiep",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/edit",
        "Use the alternate or exception business condition for Quan ly ky nang nghe nghiep",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "empty, duplicate, or too-long skill names are rejected or normalized",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "empty, duplicate, or too-long skill names are rejected or normalized",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-13-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Record the starting state before Quan ly ky nang nghe nghiep"
      ],
      "steps": [
        "Execute Quan ly ky nang nghe nghiep",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "skill list moves through added and removed states",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "skill list moves through added and removed states",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-13-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Complete the main Quan ly ky nang nghe nghiep path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "member_skills normalization avoids duplicate semantic entries",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "member_skills normalization avoids duplicate semantic entries",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-13-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Quan ly ky nang nghe nghiep",
      "preconditions": [
        "Open the UI surface for Quan ly ky nang nghe nghiep"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "skills section keeps quick-add feedback and duplicate messaging clear",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "skills section keeps quick-add feedback and duplicate messaging clear",
        "Visible state matches action/query result"
      ]
    }
  ]
})
