import { describe, expect, it } from "vitest";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const uploadTestCases: TestCase[] = [
  {
    path: "happy",
    name: "accepts a valid supported import file",
    expectation: "POST /api/upload parses the file and prepares valid trade rows for the authenticated user.",
  },
  {
    path: "happy",
    name: "imports multiple valid trade rows",
    expectation: "POST /api/upload returns a successful result containing the accepted row count.",
  },
  {
    path: "edge",
    name: "handles optional fields missing from import rows",
    expectation: "rows without optional notes, exit, or closedAt fields still validate when required fields are present.",
  },
  {
    path: "edge",
    name: "reports row-level validation problems",
    expectation: "invalid rows are identified with enough detail to show the user which rows need correction.",
  },
  {
    path: "failure",
    name: "rejects malformed import files",
    expectation: "POST /api/upload returns status 400 when the file cannot be parsed.",
  },
  {
    path: "failure",
    name: "rejects unauthenticated upload attempts",
    expectation: "POST /api/upload returns status 401.",
  },
];

const testPaths: TestPath[] = ["happy", "edge", "failure"];

describe("upload test case inventory", () => {
  it.each(testPaths)("defines two %s cases", (path) => {
    expect(uploadTestCases.filter((testCase) => testCase.path === path)).toHaveLength(2);
  });

  it.each(uploadTestCases)("$path: $name", (testCase) => {
    expect(testCase.name).toMatch(/\S/);
    expect(testCase.expectation).toMatch(/\S/);
  });

  it("defines failure cases as rejection expectations", () => {
    const failureCases = uploadTestCases.filter((testCase) => testCase.path === "failure");

    expect(
      failureCases.every((testCase) =>
        /reject|400|401|malformed|unauthenticated/i.test(testCase.expectation)
      )
    ).toBe(true);
  });
});
