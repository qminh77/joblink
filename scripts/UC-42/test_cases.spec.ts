import { defineUcTestSuite } from "../_shared/uc-test-runtime"

defineUcTestSuite({
  "uc": "UC-42",
  "module": "M06",
  "title": "Xem chi tiet viec lam",
  "actor": "Nguoi dung",
  "priority": "High",
  "source": "SRS_Joblink.tex",
  "route": "/jobs/[id]",
  "codeEntry": "src/features/jobs/api/queries.ts",
  "flow": [
    "jobs route",
    "jobs component/hook",
    "jobs action/query",
    "jobs service/policy",
    "jobs/applications/saved_jobs + notifications"
  ],
  "cases": [
    {
      "id": "UC-42-valid-xem-chi-tiet-viec-lam",
      "kind": "valid",
      "title": "Happy path completes Xem chi tiet viec lam",
      "preconditions": [
        "Actor Nguoi dung has the correct starting state",
        "Open /jobs/[id]"
      ],
      "steps": [
        "Navigate to /jobs/[id]",
        "Provide valid data for jobId",
        "Submit or trigger the Xem chi tiet viec lam flow",
        "Observe the returned UI/action result"
      ],
      "expected": [
        "The operation succeeds without validation or permission errors",
        "The UI shows the new business state immediately or after refresh",
        "The persisted data matches the submitted values"
      ],
      "dataChecks": [
        "jobId are persisted or returned correctly",
        "No unrelated entity is changed"
      ]
    },
    {
      "id": "UC-42-not-null-required-fields",
      "kind": "not_null",
      "title": "Reject missing required data for Xem chi tiet viec lam",
      "preconditions": [
        "Actor Nguoi dung can reach /jobs/[id]"
      ],
      "steps": [
        "Open /jobs/[id]",
        "Leave one required value empty: jobId",
        "Submit or trigger the Xem chi tiet viec lam flow"
      ],
      "expected": [
        "The action is rejected before mutating data",
        "A clear validation message is shown for the missing field"
      ],
      "dataChecks": [
        "Required fields are enforced: jobId",
        "Database row count/state remains unchanged"
      ]
    },
    {
      "id": "UC-42-auth-required",
      "kind": "auth",
      "title": "Enforce authentication boundary for Xem chi tiet viec lam",
      "preconditions": [
        "No active authenticated session or an expired session"
      ],
      "steps": [
        "Attempt to access /jobs/[id]",
        "Trigger the Xem chi tiet viec lam flow",
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
      "id": "UC-42-permission-ownership-state",
      "kind": "permission",
      "title": "Reject wrong actor, owner or state for Xem chi tiet viec lam",
      "preconditions": [
        "Use an account without the required role, ownership or business state"
      ],
      "steps": [
        "Open or call /jobs/[id] with a valid-looking payload",
        "Use target data that belongs to another user or is in a forbidden state",
        "Submit the Xem chi tiet viec lam flow"
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
      "id": "UC-42-boundary-invalid-input",
      "kind": "boundary",
      "title": "Validate invalid or boundary input for Xem chi tiet viec lam",
      "preconditions": [
        "Actor Nguoi dung can reach /jobs/[id]"
      ],
      "steps": [
        "Prepare boundary values for jobId",
        "Use too long text, invalid id, invalid file/type, or out-of-range enum where applicable",
        "Submit the Xem chi tiet viec lam flow"
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
      "id": "UC-42-side-effect-consistency",
      "kind": "side_effect",
      "title": "Verify side effects and cache consistency for Xem chi tiet viec lam",
      "preconditions": [
        "The Xem chi tiet viec lam happy path has completed once"
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
