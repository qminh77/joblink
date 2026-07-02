import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-60",
  "module": "M08",
  "title": "Gui bao cao vi pham",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "report dialog",
  "codeEntry": "src/features/reports/api/actions.ts",
  "flow": [
    "settings/report UI",
    "settings/report hook",
    "settings/report action",
    "service/repository",
    "users/preferences/reports"
  ],
  "cases": [
    {
      "id": "UC-60-valid-gui-bao-cao-vi-pham",
      "kind": "valid",
      "title": "Happy path completes Gui bao cao vi pham",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open report dialog"
      ],
      "steps": [
        "Navigate to report dialog",
        "Provide valid data for targetType, targetId, reason",
        "Submit or trigger the Gui bao cao vi pham flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "targetType, targetId, reason are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-60-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Gui bao cao vi pham",
      "preconditions": [
        "Actor Nguoi dung can reach report dialog"
      ],
      "steps": [
        "Open report dialog",
        "Leave one required value empty: targetType, targetId, reason",
        "Submit or trigger the Gui bao cao vi pham flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: targetType, targetId, reason",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-60-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Gui bao cao vi pham",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access report dialog",
        "Trigger the Gui bao cao vi pham flow",
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
      "id": "UC-60-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Gui bao cao vi pham",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call report dialog with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Gui bao cao vi pham flow"
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
      "id": "UC-60-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Gui bao cao vi pham",
      "preconditions": [
        "Actor Nguoi dung can reach report dialog"
      ],
      "steps": [
        "Prepare boundary values for targetType, targetId, reason",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Gui bao cao vi pham flow"
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
      "id": "UC-60-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Gui bao cao vi pham",
      "preconditions": [
        "The Gui bao cao vi pham happy path has completed once"
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
      "id": "UC-60-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Gui bao cao vi pham",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-60",
        "Route or entry point report dialog is reachable"
      ],
      "steps": [
        "Open report dialog",
        "Start the Gui bao cao vi pham control mapped to src/features/reports/api/actions.ts",
        "Complete the flow using business data: targetType, targetId, reason",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user reports a valid target with a fixed reason and optional description",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user reports a valid target with a fixed reason and optional description",
        "Input fields covered: targetType, targetId, reason"
      ]
    },
    {
      "id": "UC-60-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Gui bao cao vi pham",
      "preconditions": [
        "Actor Nguoi dung can start Gui bao cao vi pham",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open report dialog",
        "Use the alternate or exception business condition for Gui bao cao vi pham",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "missing reason, invalid target type/id, or self-ineligible target is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "missing reason, invalid target type/id, or self-ineligible target is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-60-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Gui bao cao vi pham",
      "preconditions": [
        "Record the starting state before Gui bao cao vi pham"
      ],
      "steps": [
        "Execute Gui bao cao vi pham",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "report state moves to pending moderation",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "report state moves to pending moderation",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-60-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Gui bao cao vi pham",
      "preconditions": [
        "Complete the main Gui bao cao vi pham path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "reports row is visible to admin UC-66 without exposing reporter details publicly",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "reports row is visible to admin UC-66 without exposing reporter details publicly",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-60-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Gui bao cao vi pham",
      "preconditions": [
        "Open the UI surface for Gui bao cao vi pham"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "report dialog validates reason and thanks user on success",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "report dialog validates reason and thanks user on success",
        "Visible state matches action/query result"
      ]
    }
  ]
})
