import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-12",
  "module": "M02",
  "title": "Quan ly hoc van",
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
      "id": "UC-12-valid-quan-ly-hoc-van",
      "kind": "valid",
      "title": "Happy path completes Quan ly hoc van",
      "preconditions": [
        "Actor Thanh vien has the correct starting state",
        "Open /profile/edit"
      ],
      "steps": [
        "Navigate to /profile/edit",
        "Provide valid data for schoolName, degree, fieldOfStudy",
        "Submit or trigger the Quan ly hoc van flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "schoolName, degree, fieldOfStudy are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-12-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Quan ly hoc van",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Open /profile/edit",
        "Leave one required value empty: schoolName, degree, fieldOfStudy",
        "Submit or trigger the Quan ly hoc van flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: schoolName, degree, fieldOfStudy",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-12-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Quan ly hoc van",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/edit",
        "Trigger the Quan ly hoc van flow",
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
      "id": "UC-12-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Quan ly hoc van",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/edit with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Quan ly hoc van flow"
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
      "id": "UC-12-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Quan ly hoc van",
      "preconditions": [
        "Actor Thanh vien can reach /profile/edit"
      ],
      "steps": [
        "Prepare boundary values for schoolName, degree, fieldOfStudy",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Quan ly hoc van flow"
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
      "id": "UC-12-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Quan ly hoc van",
      "preconditions": [
        "The Quan ly hoc van happy path has completed once"
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
      "id": "UC-12-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Quan ly hoc van",
      "preconditions": [
        "Actor Thanh vien matches the SRS actor for UC-12",
        "Route or entry point /profile/edit is reachable"
      ],
      "steps": [
        "Open /profile/edit",
        "Start the Quan ly hoc van control mapped to src/features/profile/api/actions.ts",
        "Complete the flow using business data: schoolName, degree, fieldOfStudy",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "member can add, edit, and delete an education entry",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "member can add, edit, and delete an education entry",
        "Input fields covered: schoolName, degree, fieldOfStudy"
      ]
    },
    {
      "id": "UC-12-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Quan ly hoc van",
      "preconditions": [
        "Actor Thanh vien can start Quan ly hoc van",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/edit",
        "Use the alternate or exception business condition for Quan ly hoc van",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "missing school, invalid dates, or overlong description is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "missing school, invalid dates, or overlong description is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-12-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Quan ly hoc van",
      "preconditions": [
        "Record the starting state before Quan ly hoc van"
      ],
      "steps": [
        "Execute Quan ly hoc van",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "education list moves through created, updated, and removed states",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "education list moves through created, updated, and removed states",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-12-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Quan ly hoc van",
      "preconditions": [
        "Complete the main Quan ly hoc van path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "member_educations updates only rows owned by the current member",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "member_educations updates only rows owned by the current member",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-12-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Quan ly hoc van",
      "preconditions": [
        "Open the UI surface for Quan ly hoc van"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "education section shows empty, editing, saved, and deleted states",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "education section shows empty, editing, saved, and deleted states",
        "Visible state matches action/query result"
      ]
    }
  ]
})
