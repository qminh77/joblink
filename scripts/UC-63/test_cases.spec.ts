import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-63",
  "module": "M09",
  "title": "Quan ly xac minh va trang thai cong ty",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/companies",
  "codeEntry": "src/features/admin/api/companies.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-63-valid-quan-ly-xac-minh-va-trang-thai-cong-ty",
      "kind": "valid",
      "title": "Happy path completes Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/companies"
      ],
      "steps": [
        "Navigate to /admin/companies",
        "Provide valid data for companyUserId, action",
        "Submit or trigger the Quan ly xac minh va trang thai cong ty flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "companyUserId, action are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-63-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/companies"
      ],
      "steps": [
        "Open /admin/companies",
        "Leave one required value empty: companyUserId, action",
        "Submit or trigger the Quan ly xac minh va trang thai cong ty flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: companyUserId, action",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-63-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/companies",
        "Trigger the Quan ly xac minh va trang thai cong ty flow",
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
      "id": "UC-63-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/companies with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Quan ly xac minh va trang thai cong ty flow"
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
      "id": "UC-63-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/companies"
      ],
      "steps": [
        "Prepare boundary values for companyUserId, action",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Quan ly xac minh va trang thai cong ty flow"
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
      "id": "UC-63-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "The Quan ly xac minh va trang thai cong ty happy path has completed once"
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
      "id": "UC-63-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-63",
        "Route or entry point /admin/companies is reachable"
      ],
      "steps": [
        "Open /admin/companies",
        "Start the Quan ly xac minh va trang thai cong ty control mapped to src/features/admin/api/companies.ts",
        "Complete the flow using business data: companyUserId, action",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "admin reviews company verification and updates company status",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "admin reviews company verification and updates company status",
        "Input fields covered: companyUserId, action"
      ]
    },
    {
      "id": "UC-63-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Actor Quan tri vien can start Quan ly xac minh va trang thai cong ty",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /admin/companies",
        "Use the alternate or exception business condition for Quan ly xac minh va trang thai cong ty",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "missing rejection note or invalid company state is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "missing rejection note or invalid company state is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-63-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Record the starting state before Quan ly xac minh va trang thai cong ty"
      ],
      "steps": [
        "Execute Quan ly xac minh va trang thai cong ty",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "company verification moves approved/rejected/pending_update/suspended as allowed",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "company verification moves approved/rejected/pending_update/suspended as allowed",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-63-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Complete the main Quan ly xac minh va trang thai cong ty path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "company moderation updates company_profiles and writes audit log",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "company moderation updates company_profiles and writes audit log",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-63-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Quan ly xac minh va trang thai cong ty",
      "preconditions": [
        "Open the UI surface for Quan ly xac minh va trang thai cong ty"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "companies panel shows review note, filters, and status feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "companies panel shows review note, filters, and status feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
