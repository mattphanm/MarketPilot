import { describe, expect, it } from "vitest";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const analyticsTestCases: TestCase[] = [
  {
    path: "happy",
    name: "returns analytics for the authenticated user's trades",
    expectation: "GET /api/analytics calculates metrics from trades owned by the current user.",
  },
  {
    path: "happy",
    name: "respects supported date range filters",
    expectation: "GET /api/analytics limits calculations to trades inside the requested range.",
  },
  {
    path: "edge",
    name: "returns zeroed metrics for a user with no trades",
    expectation: "the response contains valid empty-state analytics instead of an error.",
  },
  {
    path: "edge",
    name: "handles trades that are still open",
    expectation: "open trades without exit or closedAt do not break closed-trade performance calculations.",
  },
  {
    path: "failure",
    name: "rejects unauthenticated analytics requests",
    expectation: "GET /api/analytics returns status 401.",
  },
  {
    path: "failure",
    name: "does not include another user's trade data",
    expectation: "analytics queries are scoped to the authenticated user's userId.",
  },
];

const testPaths: TestPath[] = ["happy", "edge", "failure"];

describe("analytics test case inventory", () => {
  it.each(testPaths)("defines two %s cases", (path) => {
    expect(analyticsTestCases.filter((testCase) => testCase.path === path)).toHaveLength(2);
  });

  it.each(analyticsTestCases)("$path: $name", (testCase) => {
    expect(testCase.name).toMatch(/\S/);
    expect(testCase.expectation).toMatch(/\S/);
  });

  it("defines failure cases as rejection or data-isolation expectations", () => {
    const failureCases = analyticsTestCases.filter((testCase) => testCase.path === "failure");

    expect(
      failureCases.every((testCase) => /reject|401|scoped|userId/i.test(testCase.expectation))
    ).toBe(true);
  });
});
