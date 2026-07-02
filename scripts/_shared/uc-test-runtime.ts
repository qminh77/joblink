import { describe, expect, it } from "vitest"

export type UcCaseKind =
  | "valid"
  | "not_null"
  | "auth"
  | "permission"
  | "boundary"
  | "side_effect"
  | "business_flow"
  | "alternate_flow"
  | "state_transition"
  | "integration"
  | "ui_feedback"

export type UcTestCase = {
  id: string
  kind: UcCaseKind
  title: string
  preconditions: string[]
  steps: string[]
  expected: string[]
  dataChecks: string[]
}

export type UcTestSuite = {
  uc: `UC-${string}`
  module: `M${string}`
  title: string
  actor: string
  priority: "High" | "Medium" | "Low"
  source: "SRS_Joblink.tex"
  route: string
  codeEntry: string
  flow: string[]
  cases: UcTestCase[]
}

const REQUIRED_KINDS: UcCaseKind[] = [
  "valid",
  "not_null",
  "auth",
  "permission",
  "boundary",
  "side_effect",
  "business_flow",
  "alternate_flow",
  "state_transition",
  "integration",
  "ui_feedback",
]

export function defineUcTestSuite(suite: UcTestSuite) {
  describe(`${suite.uc} ${suite.title}`, () => {
    it("covers the required UC testcase kinds", () => {
      const kinds = new Set(suite.cases.map((testCase) => testCase.kind))
      for (const kind of REQUIRED_KINDS) {
        expect(kinds.has(kind), `${suite.uc} missing ${kind}`).toBe(true)
      }
    })

    it("is traceable to route, code entry and layered flow", () => {
      expect(suite.source).toBe("SRS_Joblink.tex")
      expect(suite.route.length).toBeGreaterThan(0)
      expect(suite.codeEntry).toMatch(/^src\//)
      expect(suite.flow.length).toBeGreaterThanOrEqual(4)
    })

    for (const testCase of suite.cases) {
      it(`${testCase.id} - ${testCase.title}`, () => {
        expect(testCase.id).toMatch(new RegExp(`^${suite.uc}-`))
        expect(testCase.title.length).toBeGreaterThan(10)
        expect(testCase.preconditions.length).toBeGreaterThan(0)
        expect(testCase.steps.length).toBeGreaterThanOrEqual(3)
        expect(testCase.expected.length).toBeGreaterThanOrEqual(2)
        expect(testCase.dataChecks.length).toBeGreaterThan(0)
      })
    }
  })
}
