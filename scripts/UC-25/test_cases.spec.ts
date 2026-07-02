import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-25",
  "module": "M03",
  "title": "Theo doi hoac bo theo doi cong ty",
  "actor": "Nguoi dung",
  "priority": "Medium",
  "source": "SRS_Joblink.tex",
  "route": "/company/[id]",
  "codeEntry": "src/features/companies/api/actions.ts",
  "flow": [
    "company route/settings tab",
    "company component/hook",
    "company action/query",
    "company service/RPC",
    "company_profiles/follows"
  ],
  "cases": [
    {
      "id": "UC-25-valid-theo-doi-hoac-bo-theo-doi-cong-ty",
      "kind": "valid",
      "title": "Happy path completes Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /company/[id]"
      ],
      "steps": [
        "Navigate to /company/[id]",
        "Provide valid data for companyUserId",
        "Submit or trigger the Theo doi hoac bo theo doi cong ty flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "companyUserId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-25-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Actor Nguoi dung can reach /company/[id]"
      ],
      "steps": [
        "Open /company/[id]",
        "Leave one required value empty: companyUserId",
        "Submit or trigger the Theo doi hoac bo theo doi cong ty flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: companyUserId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-25-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /company/[id]",
        "Trigger the Theo doi hoac bo theo doi cong ty flow",
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
      "id": "UC-25-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /company/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Theo doi hoac bo theo doi cong ty flow"
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
      "id": "UC-25-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Actor Nguoi dung can reach /company/[id]"
      ],
      "steps": [
        "Prepare boundary values for companyUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Theo doi hoac bo theo doi cong ty flow"
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
      "id": "UC-25-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "The Theo doi hoac bo theo doi cong ty happy path has completed once"
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
      "id": "UC-25-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-25",
        "Route or entry point /company/[id] is reachable"
      ],
      "steps": [
        "Open /company/[id]",
        "Start the Theo doi hoac bo theo doi cong ty control mapped to src/features/companies/api/actions.ts",
        "Complete the flow using business data: companyUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user follows and unfollows a company idempotently",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user follows and unfollows a company idempotently",
        "Input fields covered: companyUserId"
      ]
    },
    {
      "id": "UC-25-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Actor Nguoi dung can start Theo doi hoac bo theo doi cong ty",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /company/[id]",
        "Use the alternate or exception business condition for Theo doi hoac bo theo doi cong ty",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "blocked, invalid, or self-ineligible follow target is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "blocked, invalid, or self-ineligible follow target is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-25-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Record the starting state before Theo doi hoac bo theo doi cong ty"
      ],
      "steps": [
        "Execute Theo doi hoac bo theo doi cong ty",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "follow state toggles and follower count changes by one",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "follow state toggles and follower count changes by one",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-25-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Complete the main Theo doi hoac bo theo doi cong ty path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "follows row, follower count, notification, and revalidation stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "follows row, follower count, notification, and revalidation stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-25-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Theo doi hoac bo theo doi cong ty",
      "preconditions": [
        "Open the UI surface for Theo doi hoac bo theo doi cong ty"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "follow button updates instantly and recovers on failure",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "follow button updates instantly and recovers on failure",
        "Visible state matches action/query result"
      ]
    }
  ]
})
