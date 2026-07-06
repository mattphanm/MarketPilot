import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/trade-journal.tsx", "utf8");

describe("authenticated shell responsive layout", () => {
  it("pins mobile and tablet chrome while the active panel owns vertical scrolling", () => {
    expect(source).toContain(
      'className="h-dvh overflow-hidden bg-[#F7F8FA] text-[#171923] lg:flex"'
    );
    expect(source).toContain(
      'className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden"'
    );
    expect(source).toContain(
      'className="flex shrink-0 gap-2 overflow-x-auto border-b border-[#E6E8EF] bg-white px-4 py-2 lg:hidden"'
    );
    expect(source).toContain('className="min-h-0 flex-1 overflow-y-auto"');
    expect(source).toContain(
      'data-testid="authenticated-shell-scroll-container"'
    );
  });

  it("keeps every mobile tab target wired into the shared navigation", () => {
    for (const label of [
      "Dashboard",
      "Trade Log",
      "Journal",
      "Playbooks",
      "Analytics",
      "Settings",
    ]) {
      expect(source).toContain(`label: "${label}"`);
    }
  });
});
