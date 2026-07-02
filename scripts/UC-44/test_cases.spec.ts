import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-44",
  "module": "M06",
  "title": "Dang tin tuyen dung",
  "actor": "Cong ty",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/company/post-job",
  "codeEntry": "src/features/jobs/api/actions.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "UC-44-valid-dang-tin-tuyen-dung",
      "kind": "valid",
      "title": "Happy path completes Dang tin tuyen dung",
      "preconditions": [
        "Actor Cong ty has the correct starting state",
        "Open /company/post-job"
      ],
      "steps": [
        "Navigate to /company/post-job",
        "Provide valid data for title, description, jobTypeId, workModeId",
        "Submit or trigger the Dang tin tuyen dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "title, description, jobTypeId, workModeId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-44-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Dang tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job"
      ],
      "steps": [
        "Open /company/post-job",
        "Leave one required value empty: title, description, jobTypeId, workModeId",
        "Submit or trigger the Dang tin tuyen dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: title, description, jobTypeId, workModeId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-44-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Dang tin tuyen dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /company/post-job",
        "Trigger the Dang tin tuyen dung flow",
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
      "id": "UC-44-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Dang tin tuyen dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /company/post-job with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Dang tin tuyen dung flow"
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
      "id": "UC-44-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Dang tin tuyen dung",
      "preconditions": [
        "Actor Cong ty can reach /company/post-job"
      ],
      "steps": [
        "Prepare boundary values for title, description, jobTypeId, workModeId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Dang tin tuyen dung flow"
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
      "id": "UC-44-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Dang tin tuyen dung",
      "preconditions": [
        "The Dang tin tuyen dung happy path has completed once"
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
    }
  ]
})
