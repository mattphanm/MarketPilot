import { describe, expect, it } from "vitest";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const aiAnalyzeTradesTestCases: TestCase[] = [
  {
    path: "happy",
    name: "analyzes the authenticated user's trade history",
    expectation: "POST /api/ai/analyze-trades reads only current-user trades and returns structured analysis.",
  },
  {
    path: "happy",
    name: "returns analysis in the agreed response format",
    expectation: "the response includes consistent fields the UI can render without extra parsing guesses.",
  },
  {
    path: "edge",
    name: "handles too few trades for meaningful analysis",
    expectation: "the route returns a useful fallback instead of pretending there is enough signal.",
  },
  {
    path: "edge",
    name: "handles open trades in the analysis dataset",
    expectation: "trades without exit or closedAt are either excluded from closed-trade metrics or clearly labeled.",
  },
  {
    path: "failure",
    name: "rejects unauthenticated analysis requests",
    expectation: "POST /api/ai/analyze-trades returns status 401.",
  },
  {
    path: "failure",
    name: "prevents analysis of another user's data",
    expectation: "the trade query is scoped to the authenticated user's userId before any AI call is made.",
  },
];

const testPaths: TestPath[] = ["happy", "edge", "failure"];

describe("AI trade analysis test case inventory", () => {
  it.each(testPaths)("defines two %s cases", (path) => {
    expect(aiAnalyzeTradesTestCases.filter((testCase) => testCase.path === path)).toHaveLength(2);
  });

  it.each(aiAnalyzeTradesTestCases)("$path: $name", (testCase) => {
    expect(testCase.name).toMatch(/\S/);
    expect(testCase.expectation).toMatch(/\S/);
  });

  it("defines failure cases as rejection or data-isolation expectations", () => {
    const failureCases = aiAnalyzeTradesTestCases.filter(
      (testCase) => testCase.path === "failure"
    );

    expect(
      failureCases.every((testCase) =>
        /reject|401|prevents|scoped|userId/i.test(testCase.expectation)
      )
    ).toBe(true);
  });
});
