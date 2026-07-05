import { describe, expect, it } from "vitest"

export type UcCaseKind =
  | "functional"
  | "required_fields"
  | "boundary"
  | "auth"
  | "permission"
  | "alternative"
  | "state_transition"
  | "side_effect"
  | "integration"
  | "ui_feedback"
  | "regression"

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
  "functional",
  "required_fields",
  "boundary",
  "auth",
  "permission",
  "alternative",
  "state_transition",
  "side_effect",
  "integration",
  "ui_feedback",
  "regression",
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
        expect(testCase.id).toMatch(new RegExp(`^TC-[A-Z]+-${suite.uc.replace('-', '')}-\\d+$`))
        expect(testCase.title.length).toBeGreaterThan(10)
        expect(testCase.preconditions.length).toBeGreaterThan(0)
        expect(testCase.steps.length).toBeGreaterThan(0)
        expect(testCase.expected.length).toBeGreaterThan(0)
        expect(testCase.dataChecks.length).toBeGreaterThan(0)
      })
    }
  })
}
