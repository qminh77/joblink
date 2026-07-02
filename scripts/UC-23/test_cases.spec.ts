import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-23",
  "module": "M03",
  "title": "Gui lai yeu cau xac minh cong ty",
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
      "id": "UC-23-valid-gui-lai-yeu-cau-xac-minh-cong-ty",
      "kind": "valid",
      "title": "Happy path completes Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Actor Cong ty has the correct starting state",
        "Open /settings"
      ],
      "steps": [
        "Navigate to /settings",
        "Provide valid data for verificationStatus",
        "Submit or trigger the Gui lai yeu cau xac minh cong ty flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "verificationStatus are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-23-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Open /settings",
        "Leave one required value empty: verificationStatus",
        "Submit or trigger the Gui lai yeu cau xac minh cong ty flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: verificationStatus",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-23-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /settings",
        "Trigger the Gui lai yeu cau xac minh cong ty flow",
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
      "id": "UC-23-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Gui lai yeu cau xac minh cong ty flow"
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
      "id": "UC-23-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Actor Cong ty can reach /settings"
      ],
      "steps": [
        "Prepare boundary values for verificationStatus",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Gui lai yeu cau xac minh cong ty flow"
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
      "id": "UC-23-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "The Gui lai yeu cau xac minh cong ty happy path has completed once"
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
      "id": "UC-23-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Actor Cong ty matches the SRS actor for UC-23",
        "Route or entry point /settings is reachable"
      ],
      "steps": [
        "Open /settings",
        "Start the Gui lai yeu cau xac minh cong ty control mapped to src/features/companies/api/actions.ts",
        "Complete the flow using business data: verificationStatus",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "eligible company resubmits verification after rejection or pending update",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "eligible company resubmits verification after rejection or pending update",
        "Input fields covered: verificationStatus"
      ]
    },
    {
      "id": "UC-23-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Actor Cong ty can start Gui lai yeu cau xac minh cong ty",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /settings",
        "Use the alternate or exception business condition for Gui lai yeu cau xac minh cong ty",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "already verified or ineligible company cannot resubmit",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "already verified or ineligible company cannot resubmit",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-23-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Record the starting state before Gui lai yeu cau xac minh cong ty"
      ],
      "steps": [
        "Execute Gui lai yeu cau xac minh cong ty",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "verification status moves back to pending review",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "verification status moves back to pending review",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-23-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Complete the main Gui lai yeu cau xac minh cong ty path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "company verification RPC and audit log record the resubmission",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "company verification RPC and audit log record the resubmission",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-23-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Gui lai yeu cau xac minh cong ty",
      "preconditions": [
        "Open the UI surface for Gui lai yeu cau xac minh cong ty"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "verification card shows pending status and next-step copy",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "verification card shows pending status and next-step copy",
        "Visible state matches action/query result"
      ]
    }
  ]
})
