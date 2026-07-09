import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/trade-journal.tsx", "utf8");
const pageSource = readFileSync("app/page.tsx", "utf8");

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

  it("resets only the authenticated shell scroll container on top-level view changes", () => {
    expect(source).toContain("const shellScrollRef = useRef<HTMLDivElement | null>(null)");
    expect(source).toContain("ref={shellScrollRef}");
    expect(source).toContain("shellScrollContainer.scrollTop = 0");
    expect(source).toContain("shellScrollContainer.scrollLeft = 0");
    expect(source).toContain("}, [activeView]);");
    expect(source).not.toContain("window.scrollTo");
    expect(source).not.toContain("document.documentElement.scrollTop");
  });

  it("reveals focused controls inside the authenticated shell without creating a focus trap", () => {
    expect(source).toContain("function revealFocusedShellControl");
    expect(source).toContain("onFocusCapture={revealFocusedShellControl}");
    expect(source).toContain("focusedElement.scrollIntoView({");
    expect(source).toContain('block: "nearest"');
    expect(source).toContain('inline: "nearest"');
    expect(source).not.toContain("tabIndex={0}");
    expect(source).not.toContain("trapFocus");
    expect(source).not.toContain("focusTrap");
  });

  it("syncs URL-driven top-level view changes through the authenticated shell", () => {
    expect(pageSource).toContain("const initialView = parseDashboardView(resolvedSearchParams?.view)");
    expect(pageSource).toContain("key={initialView}");
    expect(source).toContain('const [activeView, setActiveView] = useState<DashboardView>(initialView)');
  });

  it("routes desktop sidebar and mobile tab navigation through the shell reset path", () => {
    expect(source).toContain("function navigateToView(view: DashboardView, resetScroll = true)");
    expect(source).toContain("onNav={navigateToView}");
    expect(source).toContain("<MobileNav activeView={activeView} onNav={navigateToView} />");
    expect(source).toContain("shouldResetShellScrollRef.current = true");
    expect(source).toContain("router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })");
  });

  it("preserves shell scroll while opening local forms, editors, drawers, filters, and sort controls", () => {
    for (const nonResetNavigation of [
      'navigateToView("journal", false)',
      'navigateToView("playbooks", false)',
    ]) {
      expect(source).toContain(nonResetNavigation);
    }

    for (const localStateChange of [
      "onSearchChange={setTradeSearch}",
      "onResultFilterChange={setResultFilter}",
      "onSideFilterChange={setSideFilter}",
      "onSortChange={updateTradeSort}",
      "onSelectTrade={(trade) => setSelectedTradeId(trade?.id ?? null)}",
      "setDeleteCandidate(trade)",
      "setTradeFormOpen(true)",
      "setEditingId(trade.id)",
    ]) {
      expect(source).toContain(localStateChange);
    }
  });

  it("keeps drawer and delete dialog overlays independently scrollable above the shell", () => {
    expect(source).toContain('className="fixed inset-0 z-40 flex justify-end overflow-hidden bg-[#171923]/20"');
    expect(source).toContain('className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"');
    expect(source).toContain('className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4"');
    expect(source).toContain('className="max-h-[calc(100vh-24px)] w-full max-w-[420px] overflow-y-auto rounded-lg bg-white shadow-2xl sm:max-h-[calc(100vh-32px)]"');
  });

  it("uses one shared account menu from the top-bar avatar and sidebar profile row", () => {
    expect(source).toContain("function AccountMenu");
    expect(source).toContain("function AccountAvatar");
    expect(source).toContain('const [openAccountMenu, setOpenAccountMenu] = useState<"topbar" | "sidebar" | null>');
    expect(source).toContain('accountMenuOpen={openAccountMenu === "sidebar"}');
    expect(source).toContain('accountMenuOpen={openAccountMenu === "topbar"}');
    expect(source).toContain('current === "sidebar" ? null : "sidebar"');
    expect(source).toContain('current === "topbar" ? null : "topbar"');
    expect(source).toContain("userImage={userImage}");
    expect(source).toContain('aria-label="Open account menu"');
  });

  it("keeps account identity, Settings, and confirmed sign out inside the account menu", () => {
    expect(source).toContain('role="menu"');
    expect(source).toContain('aria-label="Account menu"');
    expect(source).toContain("No email available");
    expect(source).toContain("onAccountSettings={openSettingsProfile}");
    expect(source).toContain("onRequestSignOut={requestSignOut}");
    expect(source).toContain("function requestSignOut()");
    expect(source).toContain("setSignOutConfirmOpen(true)");
    expect(source).toContain("<SignOutDialog onCancel={() => setSignOutConfirmOpen(false)} />");
  });

  it("closes account menus on outside click and Escape", () => {
    expect(source).toContain('document.addEventListener("mousedown", handlePointerDown)');
    expect(source).toContain('document.addEventListener("keydown", handleKeyDown)');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("onCloseAccountMenu={() => setOpenAccountMenu(null)}");
    expect(source).toContain("onMouseDown={(event) => event.stopPropagation()}");
  });

  it("routes account-menu Settings to the Profile settings tab", () => {
    expect(source).toContain('const [activeSettingsTab, setActiveSettingsTab] =');
    expect(source).toContain('useState<SettingsTab>("profile")');
    expect(source).toContain("function openSettingsProfile()");
    expect(source).toContain('setActiveSettingsTab("profile")');
    expect(source).toContain('navigateToView("settings")');
    expect(source).toContain("activeSettingsTab={activeSettingsTab}");
    expect(source).toContain("onSettingsTabChange={setActiveSettingsTab}");
  });

  it("removes duplicate shell identity controls outside the unified account menu", () => {
    expect(source).not.toContain("Futures Journal");
    expect(source.match(/<form action=\{signOutUser\}>/g)).toHaveLength(1);
  });
});
