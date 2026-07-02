import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-65",
  "module": "M09",
  "title": "Kiem duyet tin tuyen dung",
  "actor": "Quan tri vien",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/admin/jobs",
  "codeEntry": "src/features/admin/api/jobs.ts",
  "flow": [
    "admin route",
    "admin panel",
    "admin API",
    "admin service/repo",
    "audit/revalidation"
  ],
  "cases": [
    {
      "id": "UC-65-valid-kiem-duyet-tin-tuyen-dung",
      "kind": "valid",
      "title": "Happy path completes Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien has the correct starting state",
        "Open /admin/jobs"
      ],
      "steps": [
        "Navigate to /admin/jobs",
        "Provide valid data for jobId, action",
        "Submit or trigger the Kiem duyet tin tuyen dung flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "jobId, action are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-65-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/jobs"
      ],
      "steps": [
        "Open /admin/jobs",
        "Leave one required value empty: jobId, action",
        "Submit or trigger the Kiem duyet tin tuyen dung flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: jobId, action",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-65-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Kiem duyet tin tuyen dung",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /admin/jobs",
        "Trigger the Kiem duyet tin tuyen dung flow",
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
      "id": "UC-65-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /admin/jobs with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Kiem duyet tin tuyen dung flow"
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
      "id": "UC-65-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Kiem duyet tin tuyen dung",
      "preconditions": [
        "Actor Quan tri vien can reach /admin/jobs"
      ],
      "steps": [
        "Prepare boundary values for jobId, action",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Kiem duyet tin tuyen dung flow"
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
      "id": "UC-65-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Kiem duyet tin tuyen dung",
      "preconditions": [
        "The Kiem duyet tin tuyen dung happy path has completed once"
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
