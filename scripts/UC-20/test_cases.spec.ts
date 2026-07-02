import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-20",
  "module": "M03",
  "title": "Cap nhat ho so cong ty",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
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
      "id": "UC-20-valid-cap-nhat-ho-so-cong-ty",
      "kind": "valid",
      "title": "Happy path completes Cap nhat ho so cong ty",
      "preconditions": [
        "Actor Cong ty has the correct starting state",
        "Open /settings"
      ],
      "steps": [
        "Navigate to /settings",
        "Provide valid data for companyName, industry, taxId",
        "Submit or trigger the Cap nhat ho so cong ty flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "companyName, industry, taxId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-20-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Cap nhat ho so cong ty",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Open /settings",
        "Leave one required value empty: companyName, industry, taxId",
        "Submit or trigger the Cap nhat ho so cong ty flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: companyName, industry, taxId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-20-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Cap nhat ho so cong ty",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /settings",
        "Trigger the Cap nhat ho so cong ty flow",
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
      "id": "UC-20-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Cap nhat ho so cong ty",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Cap nhat ho so cong ty flow"
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
      "id": "UC-20-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Cap nhat ho so cong ty",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Prepare boundary values for companyName, industry, taxId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Cap nhat ho so cong ty flow"
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
      "id": "UC-20-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Cap nhat ho so cong ty",
      "preconditions": [
        "The Cap nhat ho so cong ty happy path has completed once"
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
      "id": "UC-20-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Cap nhat ho so cong ty",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-20",
        "Route or entry point /settings is reachable"
      ],
      "steps": [
        "Open /settings",
        "Start the Cap nhat ho so cong ty control mapped to src/features/companies/api/actions.ts",
        "Complete the flow using business data: companyName, industry, taxId",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "company profile information is updated and appears on settings/public page",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "company profile information is updated and appears on settings/public page",
        "Input fields covered: companyName, industry, taxId"
      ]
    },
    {
      "id": "UC-20-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Cap nhat ho so cong ty",
      "preconditions": [
        "Actor Cong ty can start Cap nhat ho so cong ty",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /settings",
        "Use the alternate or exception business condition for Cap nhat ho so cong ty",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "missing company name, invalid tax id, or overlong fields are rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "missing company name, invalid tax id, or overlong fields are rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-20-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Cap nhat ho so cong ty",
      "preconditions": [
        "Record the starting state before Cap nhat ho so cong ty"
      ],
      "steps": [
        "Execute Cap nhat ho so cong ty",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "company profile moves to saved updated state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "company profile moves to saved updated state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-20-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Cap nhat ho so cong ty",
      "preconditions": [
        "Complete the main Cap nhat ho so cong ty path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "company_profiles update is scoped to current company account",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "company_profiles update is scoped to current company account",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-20-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Cap nhat ho so cong ty",
      "preconditions": [
        "Open the UI surface for Cap nhat ho so cong ty"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "company form shows saved values and validation feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "company form shows saved values and validation feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
