import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-02",
  "module": "M01",
  "title": "Dang ky tai khoan cong ty",
  "actor": "Khach",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/register",
  "codeEntry": "src/features/auth/api/auth-actions.ts",
  "flow": [
    "public auth route",
    "auth component/hook",
    "auth action/client",
    "Supabase Auth",
    "public.users mirror"
  ],
  "cases": [
    {
      "id": "UC-02-valid-dang-ky-tai-khoan-cong-ty",
      "kind": "valid",
      "title": "Happy path completes Dang ky tai khoan cong ty",
      "preconditions": [
        "Actor Khach has the correct starting state",
        "Open /register"
      ],
      "steps": [
        "Navigate to /register",
        "Provide valid data for companyName, taxId, representativeName, email, password, termsAccepted",
        "Submit or trigger the Dang ky tai khoan cong ty flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "companyName, taxId, representativeName, email, password, termsAccepted are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-02-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dang ky tai khoan cong ty",
      "preconditions": [
        "Actor Khach can reach /register"
      ],
      "steps": [
        "Open /register",
        "Leave one required value empty: companyName, taxId, representativeName, email, password, termsAccepted",
        "Submit or trigger the Dang ky tai khoan cong ty flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: companyName, taxId, representativeName, email, password, termsAccepted",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-02-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dang ky tai khoan cong ty",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /register",
        "Trigger the Dang ky tai khoan cong ty flow",
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
      "id": "UC-02-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dang ky tai khoan cong ty",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /register with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dang ky tai khoan cong ty flow"
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
      "id": "UC-02-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dang ky tai khoan cong ty",
      "preconditions": [
        "Actor Khach can reach /register"
      ],
      "steps": [
        "Prepare boundary values for companyName, taxId, representativeName, email, password, termsAccepted",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dang ky tai khoan cong ty flow"
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
      "id": "UC-02-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dang ky tai khoan cong ty",
      "preconditions": [
        "The Dang ky tai khoan cong ty happy path has completed once"
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
      "id": "UC-02-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Dang ky tai khoan cong ty",
      "preconditions": [
        "Actor Khach matches the SRS actor for UC-02",
        "Route or entry point /register is reachable"
      ],
      "steps": [
        "Open /register",
        "Start the Dang ky tai khoan cong ty control mapped to src/features/auth/api/auth-actions.ts",
        "Complete the flow using business data: companyName, taxId, representativeName, email, password, termsAccepted",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "company account and company profile are created with pending verification state",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "company account and company profile are created with pending verification state",
        "Input fields covered: companyName, taxId, representativeName, email, password, termsAccepted"
      ]
    },
    {
      "id": "UC-02-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Dang ky tai khoan cong ty",
      "preconditions": [
        "Actor Khach can start Dang ky tai khoan cong ty",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /register",
        "Use the alternate or exception business condition for Dang ky tai khoan cong ty",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "duplicate tax id/email or missing representative information is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "duplicate tax id/email or missing representative information is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-02-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Dang ky tai khoan cong ty",
      "preconditions": [
        "Record the starting state before Dang ky tai khoan cong ty"
      ],
      "steps": [
        "Execute Dang ky tai khoan cong ty",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "guest state moves to company account pending verification",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "guest state moves to company account pending verification",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-02-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Dang ky tai khoan cong ty",
      "preconditions": [
        "Complete the main Dang ky tai khoan cong ty path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Auth user, public.users row, and company_profiles row stay synchronized",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Auth user, public.users row, and company_profiles row stay synchronized",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-02-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Dang ky tai khoan cong ty",
      "preconditions": [
        "Open the UI surface for Dang ky tai khoan cong ty"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "company register form exposes company-only fields and approval notice",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "company register form exposes company-only fields and approval notice",
        "Visible state matches action/query result"
      ]
    }
  ]
})
