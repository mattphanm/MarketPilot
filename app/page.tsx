import { signInWithGoogle } from "@/app/actions/auth";
import TradeJournal from "@/app/components/trade-journal";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BarChart2, BookOpen, Target, TrendingUp } from "lucide-react";
import type { PlaybookDto } from "@/lib/playbooks/types";
import type { TradeDto } from "@/lib/trades/types";

function serializeTrade(trade: {
  id: string;
  playbookId: string | null;
  symbol: string;
  side: string;
  riskDollars: number;
  rMultiple: number;
  openedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  journalEntry: {
    id: string;
    tradeId: string;
    tradeIdea: string;
    confluences: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}): TradeDto {
  return {
    id: trade.id,
    playbookId: trade.playbookId ?? "",
    symbol: trade.symbol,
    side: trade.side as TradeDto["side"],
    riskDollars: trade.riskDollars,
    rMultiple: trade.rMultiple,
    openedAt: trade.openedAt.toISOString(),
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
    journalEntry: trade.journalEntry
      ? {
          id: trade.journalEntry.id,
          tradeId: trade.journalEntry.tradeId,
          tradeIdea: trade.journalEntry.tradeIdea,
          confluences: trade.journalEntry.confluences,
          createdAt: trade.journalEntry.createdAt.toISOString(),
          updatedAt: trade.journalEntry.updatedAt.toISOString(),
        }
      : null,
  };
}

function serializePlaybook(playbook: {
  id: string;
  name: string;
  description: string;
  color: string;
  rules: string[];
  createdAt: Date;
  updatedAt: Date;
}): PlaybookDto {
  return {
    id: playbook.id,
    name: playbook.name,
    description: playbook.description,
    color: playbook.color,
    rules: playbook.rules,
    createdAt: playbook.createdAt.toISOString(),
    updatedAt: playbook.updatedAt.toISOString(),
  };
}

const features = [
  { icon: BarChart2, label: "Portfolio Analytics", desc: "P&L curves, drawdown, risk-adjusted returns" },
  { icon: BookOpen, label: "Structured Journaling", desc: "Thesis, risk plan, catalyst, and post-trade review" },
  { icon: Target, label: "Playbook System", desc: "Define, track, and improve repeatable setups" },
] as const;

function SignInScreen() {
  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Left sidebar */}
      <div className="hidden lg:flex w-[480px] shrink-0 flex-col justify-between bg-[#1E1B2E] p-10">
        <div>
          <div className="mb-12 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5DD3]">
              <TrendingUp size={18} color="#fff" />
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-white">MarketPilot</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-white">
            The investor analytics<br />platform built for<br />serious traders.
          </h1>
          <p className="text-[15px] leading-relaxed text-[#A8A5C1]">
            Track performance, journal trades, analyze strategy quality, and build repeatable playbooks — all in one command center.
          </p>
        </div>

        <div className="space-y-5">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6C5DD3]/25">
                <Icon size={15} color="#6C5DD3" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-white">{label}</div>
                <div className="mt-0.5 text-[12px] text-[#A8A5C1]">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-[#5A5778]">© 2026 MarketPilot · Analytics for serious investors</div>
      </div>

      {/* Right: sign-in form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6C5DD3]">
              <TrendingUp size={15} color="#fff" />
            </div>
            <span className="text-[16px] font-semibold tracking-tight text-[#171923]">MarketPilot</span>
          </div>

          <div className="mb-8">
            <h2 className="text-[24px] font-bold text-[#171923]">Welcome back</h2>
            <p className="mt-1 text-[14px] text-[#697386]">Sign in to access your investment command center.</p>
          </div>

          {/* Google sign-in */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E6E8EF] bg-white px-4 py-2.5 text-[14px] font-medium text-[#171923] transition hover:shadow-md active:scale-[0.99]"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.448 17.64 12 17.64 9.2z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E6E8EF]" />
            <span className="text-[12px] text-[#697386]">or</span>
            <div className="h-px flex-1 bg-[#E6E8EF]" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#697386]">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-[#E6E8EF] bg-white px-3 py-2 text-[13px] text-[#171923] outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-[#697386]">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#E6E8EF] bg-white px-3 py-2 text-[13px] text-[#171923] outline-none focus:border-[#6C5DD3] focus:ring-2 focus:ring-[#6C5DD3]/10"
              />
            </div>
            <button
              type="button"
              disabled
              className="w-full rounded-lg bg-[#6C5DD3] py-2.5 text-[14px] font-medium text-white opacity-50 cursor-not-allowed"
            >
              Sign in
            </button>
          </div>

          <p className="mt-6 text-center text-[12px] text-[#697386]">
            Don&apos;t have an account?{" "}
            <button type="button" className="text-[#6C5DD3] underline">Start free trial</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <SignInScreen />;
  }

  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: [{ openedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      playbookId: true,
      symbol: true,
      side: true,
      riskDollars: true,
      rMultiple: true,
      openedAt: true,
      createdAt: true,
      updatedAt: true,
      journalEntry: true,
    },
  });
  const playbooks = await prisma.playbook.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      rules: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serializedTrades = trades.map(serializeTrade);
  const serializedPlaybooks = playbooks.map(serializePlaybook);
  const displayName =
    session.user?.name ?? session.user?.email ?? "Authenticated trader";

  return (
    <TradeJournal
      initialTrades={serializedTrades}
      initialPlaybooks={serializedPlaybooks}
      userName={displayName}
      userEmail={session.user?.email}
      nowIso={new Date().toISOString()}
    />
  );
}
