import { describe, expect, it } from "vitest";
import { formatTradeDateInput, parseTradeDateInput } from "../lib/trades/date-input";

const referenceDate = new Date(2026, 5, 20, 8, 0);

function expectIso(input: string) {
  const result = parseTradeDateInput(input, referenceDate);

  expect(result.ok).toBe(true);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.iso;
}

describe("trade date input parsing", () => {
  it("accepts ISO-like date and 24-hour time", () => {
    expect(expectIso("2026-06-20 14:30")).toBe(
      new Date(2026, 5, 20, 14, 30).toISOString()
    );
  });

  it("accepts slash dates with explicit or inferred years", () => {
    expect(expectIso("6/20/2026 14:30")).toBe(
      new Date(2026, 5, 20, 14, 30).toISOString()
    );
    expect(expectIso("6/20 14:30")).toBe(
      new Date(2026, 5, 20, 14, 30).toISOString()
    );
  });

  it("accepts month-name dates and relative dates", () => {
    expect(expectIso("Jun 20 2026 14:30")).toBe(
      new Date(2026, 5, 20, 14, 30).toISOString()
    );
    expect(expectIso("June 20 2026 14:30")).toBe(
      new Date(2026, 5, 20, 14, 30).toISOString()
    );
    expect(expectIso("yesterday 09:15")).toBe(
      new Date(2026, 5, 19, 9, 15).toISOString()
    );
  });

  it("accepts time-only input using today's date", () => {
    expect(expectIso("1430")).toBe(new Date(2026, 5, 20, 14, 30).toISOString());
    expect(expectIso("14:30")).toBe(
      new Date(2026, 5, 20, 14, 30).toISOString()
    );
  });

  it("rejects AM/PM and incomplete date-only input", () => {
    expect(parseTradeDateInput("2:30pm", referenceDate).ok).toBe(false);
    expect(parseTradeDateInput("2026-06-20", referenceDate).ok).toBe(false);
  });

  it("rejects invalid dates and out-of-range times", () => {
    expect(parseTradeDateInput("2026-02-30 14:30", referenceDate).ok).toBe(false);
    expect(parseTradeDateInput("2026-06-20 24:00", referenceDate).ok).toBe(false);
    expect(parseTradeDateInput("2026-06-20 14:60", referenceDate).ok).toBe(false);
  });

  it("formats stored ISO values as local 24-hour input", () => {
    const iso = new Date(2026, 5, 20, 14, 30).toISOString();

    expect(formatTradeDateInput(iso)).toBe("2026-06-20 14:30");
    expect(formatTradeDateInput(null)).toBe("");
  });
});
