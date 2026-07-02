import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-56",
  "module": "M08",
  "title": "Cap nhat thong tin tai khoan",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/settings",
  "codeEntry": "src/features/settings/api/actions.ts",
  "flow": [
    "settings/report UI",
    "settings/report hook",
    "settings/report action",
    "service/repository",
    "users/preferences/reports"
  ],
  "cases": [
    {
      "id": "UC-56-valid-cap-nhat-thong-tin-tai-khoan",
      "kind": "valid",
      "title": "Happy path completes Cap nhat thong tin tai khoan",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /settings"
      ],
      "steps": [
        "Navigate to /settings",
        "Provide valid data for emailOrPhoneOrLocale",
        "Submit or trigger the Cap nhat thong tin tai khoan flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "emailOrPhoneOrLocale are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-56-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Open /settings",
        "Leave one required value empty: emailOrPhoneOrLocale",
        "Submit or trigger the Cap nhat thong tin tai khoan flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: emailOrPhoneOrLocale",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-56-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Cap nhat thong tin tai khoan",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /settings",
        "Trigger the Cap nhat thong tin tai khoan flow",
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
      "id": "UC-56-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /settings with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Cap nhat thong tin tai khoan flow"
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
      "id": "UC-56-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Actor Nguoi dung can reach /settings"
      ],
      "steps": [
        "Prepare boundary values for emailOrPhoneOrLocale",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Cap nhat thong tin tai khoan flow"
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
      "id": "UC-56-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Cap nhat thong tin tai khoan",
      "preconditions": [
        "The Cap nhat thong tin tai khoan happy path has completed once"
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
      "id": "UC-56-business-main-flow",
      "kind": "business_flow",
      "title": "Run SRS business flow for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Actor Nguoi dung matches the SRS actor for UC-56",
        "Route or entry point /settings is reachable"
      ],
      "steps": [
        "Open /settings",
        "Start the Cap nhat thong tin tai khoan control mapped to src/features/settings/api/actions.ts",
        "Complete the flow using business data: emailOrPhoneOrLocale",
        "Confirm the final business result and returned state"
      ],
      "expected": [
        "user updates account email, phone, or locale",
        "The result is visible to the actor in the same workflow",
        "No unrelated feature state is changed"
      ],
      "dataChecks": [
        "user updates account email, phone, or locale",
        "Input fields covered: emailOrPhoneOrLocale"
      ]
    },
    {
      "id": "UC-56-alternate-business-flow",
      "kind": "alternate_flow",
      "title": "Exercise SRS alternative flow for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Actor Nguoi dung can start Cap nhat thong tin tai khoan",
        "Prepare data that triggers the documented exception path"
      ],
      "steps": [
        "Open /settings",
        "Use the alternate or exception business condition for Cap nhat thong tin tai khoan",
        "Submit the flow and inspect the action result"
      ],
      "expected": [
        "invalid email/phone/locale or duplicate email is rejected",
        "The system explains the rejection without exposing sensitive data"
      ],
      "dataChecks": [
        "invalid email/phone/locale or duplicate email is rejected",
        "No partial mutation is committed"
      ]
    },
    {
      "id": "UC-56-business-state-transition",
      "kind": "state_transition",
      "title": "Verify business state transition for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Record the starting state before Cap nhat thong tin tai khoan"
      ],
      "steps": [
        "Execute Cap nhat thong tin tai khoan",
        "Reload the relevant page/query",
        "Compare before and after state"
      ],
      "expected": [
        "account info moves to pending verification or saved account state",
        "The transition is repeatable or idempotent according to the UC"
      ],
      "dataChecks": [
        "account info moves to pending verification or saved account state",
        "Old and new state are not both active when mutually exclusive"
      ]
    },
    {
      "id": "UC-56-business-integration-check",
      "kind": "integration",
      "title": "Verify cross-feature integration for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Complete the main Cap nhat thong tin tai khoan path once"
      ],
      "steps": [
        "Open the dependent feature, list, badge, notification, audit, or public page",
        "Refresh or refetch the dependent data",
        "Confirm the dependent state follows the source action"
      ],
      "expected": [
        "Supabase Auth, public.users, email change mailer, and audit state stay consistent",
        "Dependent surfaces do not show stale or duplicated data"
      ],
      "dataChecks": [
        "Supabase Auth, public.users, email change mailer, and audit state stay consistent",
        "Related cache/revalidation/realtime output is consistent"
      ]
    },
    {
      "id": "UC-56-business-ui-feedback",
      "kind": "ui_feedback",
      "title": "Verify UI feedback for Cap nhat thong tin tai khoan",
      "preconditions": [
        "Open the UI surface for Cap nhat thong tin tai khoan"
      ],
      "steps": [
        "Trigger loading, validation error, success, and empty/no-result states where applicable",
        "Observe controls, disabled states, toasts, dialogs, and redirects",
        "Repeat once to check idempotent or duplicate-click behavior"
      ],
      "expected": [
        "settings account card shows verification and saved feedback",
        "The UI does not feel stuck, stale, or ambiguous after the action"
      ],
      "dataChecks": [
        "settings account card shows verification and saved feedback",
        "Visible state matches action/query result"
      ]
    }
  ]
})
