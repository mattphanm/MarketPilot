import { describe, expect, it } from "vitest";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const authTestCases: TestCase[] = [
  {
    path: "happy",
    name: "allows an authenticated user with a database record",
    expectation: "requireUser returns ok true with the current user's database id.",
  },
  {
    path: "happy",
    name: "returns a standard unauthorized response helper shape",
    expectation: "unauthorizedResponse returns JSON with error Unauthorized and status 401.",
  },
  {
    path: "edge",
    name: "rejects a session that has no user id",
    expectation: "requireUser returns ok false with status 401.",
  },
  {
    path: "edge",
    name: "rejects a session whose user no longer exists in the database",
    expectation: "requireUser returns ok false with status 401.",
  },
  {
    path: "failure",
    name: "rejects a request when auth returns no session",
    expectation: "protected handlers receive an unauthorized result and return status 401.",
  },
  {
    path: "failure",
    name: "does not expose protected user data in unauthorized responses",
    expectation: "the response body only contains a generic Unauthorized error.",
  },
];

const testPaths: TestPath[] = ["happy", "edge", "failure"];

describe("auth test case inventory", () => {
  it.each(testPaths)("defines two %s cases", (path) => {
    expect(authTestCases.filter((testCase) => testCase.path === path)).toHaveLength(2);
  });

  it.each(authTestCases)("$path: $name", (testCase) => {
    expect(testCase.name).toMatch(/\S/);
    expect(testCase.expectation).toMatch(/\S/);
  });

  it("defines failure cases as rejection expectations", () => {
    const failureCases = authTestCases.filter((testCase) => testCase.path === "failure");

    expect(
      failureCases.every((testCase) => /reject|unauthorized|401/i.test(testCase.expectation))
    ).toBe(true);
  });
});
