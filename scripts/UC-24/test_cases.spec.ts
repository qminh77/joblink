import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-24",
  "module": "M03",
  "title": "Xem trang cong ty",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/[id]",
  "codeEntry": "src/features/companies/api/queries.ts",
  "flow": [
    "company route/settings tab",
    "company component/hook",
    "company action/query",
    "company service/RPC",
    "company_profiles/follows"
  ],
  "cases": [
    {
      "id": "UC-24-valid-xem-trang-cong-ty",
      "kind": "valid",
      "title": "Happy path completes Xem trang cong ty",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /company/[id]"
      ],
      "steps": [
        "Navigate to /company/[id]",
        "Provide valid data for companyUserId",
        "Submit or trigger the Xem trang cong ty flow",
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
      "id": "UC-24-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem trang cong ty",
      "preconditions": [
        "Actor Nguoi dung can reach /company/[id]"
      ],
      "steps": [
        "Open /company/[id]",
        "Leave one required value empty: companyUserId",
        "Submit or trigger the Xem trang cong ty flow"
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
      "id": "UC-24-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem trang cong ty",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /company/[id]",
        "Trigger the Xem trang cong ty flow",
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
      "id": "UC-24-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem trang cong ty",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /company/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem trang cong ty flow"
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
      "id": "UC-24-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem trang cong ty",
      "preconditions": [
        "Actor Nguoi dung can reach /company/[id]"
      ],
      "steps": [
        "Prepare boundary values for companyUserId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem trang cong ty flow"
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
      "id": "UC-24-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem trang cong ty",
      "preconditions": [
        "The Xem trang cong ty happy path has completed once"
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
      "id": "UC-24-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xem trang cong ty",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-24",
        "Route or entry point /company/[id] is reachable"
      ],
      "steps": [
        "Open /company/[id]",
        "Start the Xem trang cong ty control mapped to src/features/companies/api/queries.ts",
        "Complete the flow using business data: companyUserId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user opens a company page with company profile, posts, and active jobs",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user opens a company page with company profile, posts, and active jobs",
        "Input fields covered: companyUserId"
      ]
    },
    {
      "id": "UC-24-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xem trang cong ty",
      "preconditions": [
        "Actor Nguoi dung can start Xem trang cong ty",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /company/[id]",
        "Use the alternate or exception business condition for Xem trang cong ty",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "missing, suspended, or hidden company returns safe empty/not-found state",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "missing, suspended, or hidden company returns safe empty/not-found state",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-24-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xem trang cong ty",
      "preconditions": [
        "Record the starting state before Xem trang cong ty"
      ],
      "steps": [
        "Execute Xem trang cong ty",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "company page moves to loaded public overview state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "company page moves to loaded public overview state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-24-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xem trang cong ty",
      "preconditions": [
        "Complete the main Xem trang cong ty path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "company overview RPC joins profile, posts, follower state, and jobs consistently",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "company overview RPC joins profile, posts, follower state, and jobs consistently",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-24-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xem trang cong ty",
      "preconditions": [
        "Open the UI surface for Xem trang cong ty"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "company page handles loading, empty jobs, and follow state",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "company page handles loading, empty jobs, and follow state",
        "Visible state matches action/query result"
      ]
    }
  ]
})
