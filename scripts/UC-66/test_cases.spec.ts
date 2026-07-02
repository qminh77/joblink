import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-66",
  "module": "M09",
  "title": "Xu ly bao cao vi pham",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/reports",
  "codeEntry": "src/features/admin/api/reports.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-66-valid-xu-ly-bao-cao-vi-pham",
      "kind": "valid",
      "title": "Happy path completes Xu ly bao cao vi pham",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/reports"
      ],
      "steps": [
        "Navigate to /admin/reports",
        "Provide valid data for reportId, action",
        "Submit or trigger the Xu ly bao cao vi pham flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "reportId, action are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-66-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xu ly bao cao vi pham",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/reports"
      ],
      "steps": [
        "Open /admin/reports",
        "Leave one required value empty: reportId, action",
        "Submit or trigger the Xu ly bao cao vi pham flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: reportId, action",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-66-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xu ly bao cao vi pham",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/reports",
        "Trigger the Xu ly bao cao vi pham flow",
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
      "id": "UC-66-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xu ly bao cao vi pham",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/reports with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xu ly bao cao vi pham flow"
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
      "id": "UC-66-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xu ly bao cao vi pham",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/reports"
      ],
      "steps": [
        "Prepare boundary values for reportId, action",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xu ly bao cao vi pham flow"
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
      "id": "UC-66-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xu ly bao cao vi pham",
      "preconditions": [
        "The Xu ly bao cao vi pham happy path has completed once"
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
      "id": "UC-66-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Xu ly bao cao vi pham",
      "preconditions": [
        "Actor Quan tri vien matches the SRS actor for UC-66",
        "Route or entry point /admin/reports is reachable"
      ],
      "steps": [
        "Open /admin/reports",
        "Start the Xu ly bao cao vi pham control mapped to src/features/admin/api/reports.ts",
        "Complete the flow using business data: reportId, action",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "admin changes report status or applies a moderation action",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "admin changes report status or applies a moderation action",
        "Input fields covered: reportId, action"
      ]
    },
    {
      "id": "UC-66-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Xu ly bao cao vi pham",
      "preconditions": [
        "Actor Quan tri vien can start Xu ly bao cao vi pham",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /admin/reports",
        "Use the alternate or exception business condition for Xu ly bao cao vi pham",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid transition, missing reason, or already resolved report is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid transition, missing reason, or already resolved report is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-66-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Xu ly bao cao vi pham",
      "preconditions": [
        "Record the starting state before Xu ly bao cao vi pham"
      ],
      "steps": [
        "Execute Xu ly bao cao vi pham",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "report state moves pending/reviewing/resolved/dismissed",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "report state moves pending/reviewing/resolved/dismissed",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-66-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Xu ly bao cao vi pham",
      "preconditions": [
        "Complete the main Xu ly bao cao vi pham path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "report, moderation_actions, target entity, and audit log stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "report, moderation_actions, target entity, and audit log stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-66-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Xu ly bao cao vi pham",
      "preconditions": [
        "Open the UI surface for Xu ly bao cao vi pham"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "reports panel shows action modal, status badge, and result feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "reports panel shows action modal, status badge, and result feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
