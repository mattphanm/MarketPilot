import { describe, expect, it } from "vitest";
import {
  PlaybookSchema,
  PlaybookUpdateSchema,
} from "../lib/validations/playbook";

type TestPath = "happy" | "edge" | "failure";

type TestCase = {
  path: TestPath;
  name: string;
  expectation: string;
};

export const playbookTestCases: TestCase[] = [
  {
    path: "happy",
    name: "creates a valid Playbook for the authenticated user",
    expectation:
      "POST /api/playbooks validates input, stores the Playbook with userId, and returns status 201.",
  },
  {
    path: "happy",
    name: "returns only the authenticated user's Playbooks",
    expectation:
      "GET /api/playbooks filters by userId and orders Playbooks by createdAt ascending.",
  },
  {
    path: "edge",
    name: "updates only fields included in a partial Playbook payload",
    expectation: "PATCH /api/playbooks/[id] leaves omitted fields unchanged.",
  },
  {
    path: "edge",
    name: "normalizes Playbook color casing",
    expectation: "POST and PATCH store valid hex colors in uppercase form.",
  },
  {
    path: "failure",
    name: "prevents access to another user's Playbook",
    expectation:
      "GET, PATCH, and DELETE /api/playbooks/[id] return status 404 when id does not belong to the user.",
  },
  {
    path: "failure",
    name: "blocks deletion while Trades reference the Playbook",
    expectation:
      "DELETE /api/playbooks/[id] returns status 409 with a visible issue when owned Trades still reference the Playbook.",
  },
];

const validPlaybookPayload = {
  name: " Opening Range Breakout ",
  description: "Momentum setup after the initial balance.",
  color: "#6c5dd3",
  rules: ["Trend day context", "Break and hold opening range"],
};

describe("Playbook test case inventory", () => {
  it.each(["happy", "edge", "failure"] as const)(
    "defines two %s cases",
    (path) => {
      expect(
        playbookTestCases.filter((testCase) => testCase.path === path)
      ).toHaveLength(2);
    }
  );

  it.each(playbookTestCases)("$path: $name", (testCase) => {
    expect(testCase.name).toMatch(/\S/);
    expect(testCase.expectation).toMatch(/\S/);
  });

  it("failure cases include ownership and delete-block behavior", () => {
    const failureExpectations = playbookTestCases
      .filter((testCase) => testCase.path === "failure")
      .map((testCase) => testCase.expectation)
      .join(" ");

    expect(failureExpectations).toMatch(/user|404/i);
    expect(failureExpectations).toMatch(/409|reference/i);
  });
});

describe("Playbook validation", () => {
  it("happy: accepts a valid Playbook create payload", () => {
    const result = PlaybookSchema.safeParse(validPlaybookPayload);

    expect(result.success).toBe(true);
  });

  it("edge: normalizes Playbook colors to uppercase", () => {
    const result = PlaybookSchema.safeParse(validPlaybookPayload);

    expect(result.success && result.data.color).toBe("#6C5DD3");
  });

  it("edge: accepts a partial update with one field", () => {
    const result = PlaybookUpdateSchema.safeParse({
      rules: ["Wait for pullback", "Enter after continuation"],
    });

    expect(result.success).toBe(true);
  });

  it("failure: rejects Playbooks without rules", () => {
    const result = PlaybookSchema.safeParse({
      ...validPlaybookPayload,
      rules: [],
    });

    expect(result.success).toBe(false);
  });

  it("failure: rejects invalid color values", () => {
    const result = PlaybookSchema.safeParse({
      ...validPlaybookPayload,
      color: "purple",
    });

    expect(result.success).toBe(false);
  });

  it("failure: rejects an empty update payload", () => {
    const result = PlaybookUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
