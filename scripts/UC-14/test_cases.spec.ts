import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-14",
  "module": "M02",
  "title": "Xem ho so nguoi dung",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/profile/[id]",
  "codeEntry": "src/features/profile/api/queries.ts",
  "flow": [
    "profile route",
    "profile component/hook",
    "profile or CV action/query",
    "profile service/repo",
    "Supabase tables/storage"
  ],
  "cases": [
    {
      "id": "UC-14-valid-xem-ho-so-nguoi-dung",
      "kind": "valid",
      "title": "Happy path completes Xem ho so nguoi dung",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /profile/[id]"
      ],
      "steps": [
        "Navigate to /profile/[id]",
        "Provide valid data for profileUserId",
        "Submit or trigger the Xem ho so nguoi dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "profileUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-14-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem ho so nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]"
      ],
      "steps": [
        "Open /profile/[id]",
        "Leave one required value empty: profileUserId",
        "Submit or trigger the Xem ho so nguoi dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: profileUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-14-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem ho so nguoi dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /profile/[id]",
        "Trigger the Xem ho so nguoi dung flow",
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
      "id": "UC-14-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem ho so nguoi dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /profile/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem ho so nguoi dung flow"
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
      "id": "UC-14-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem ho so nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can reach /profile/[id]"
      ],
      "steps": [
        "Prepare boundary values for profileUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem ho so nguoi dung flow"
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
      "id": "UC-14-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem ho so nguoi dung",
      "preconditions": [
        "The Xem ho so nguoi dung happy path has completed once"
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
      "id": "UC-14-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem ho so nguoi dung",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-14",
        "Route or entry point /profile/[id] is reachable"
      ],
      "steps": [
        "Open /profile/[id]",
        "Start the Xem ho so nguoi dung control mapped to src/features/profile/api/queries.ts",
        "Complete the flow using business data: profileUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "viewer can see a profile allowed by visibility rules",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "viewer can see a profile allowed by visibility rules",
        "Input fields covered: profileUserId"
      ]
    },
    {
      "id": "UC-14-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem ho so nguoi dung",
      "preconditions": [
        "Actor Nguoi dung can start Xem ho so nguoi dung",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /profile/[id]",
        "Use the alternate or exception business condition for Xem ho so nguoi dung",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "private or blocked profile hides protected details",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "private or blocked profile hides protected details",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-14-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem ho so nguoi dung",
      "preconditions": [
        "Record the starting state before Xem ho so nguoi dung"
      ],
      "steps": [
        "Execute Xem ho so nguoi dung",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "profile view moves to visible, limited, or denied state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "profile view moves to visible, limited, or denied state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-14-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem ho so nguoi dung",
      "preconditions": [
        "Complete the main Xem ho so nguoi dung path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "profile visibility, connection relation, and block checks are applied together",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "profile visibility, connection relation, and block checks are applied together",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-14-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem ho so nguoi dung",
      "preconditions": [
        "Open the UI surface for Xem ho so nguoi dung"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "profile page shows public, private, and not-found states clearly",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "profile page shows public, private, and not-found states clearly",
        "Visible state matches action/query result"
      ]
    }
  ]
})
