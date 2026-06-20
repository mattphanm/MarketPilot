import { signInWithGoogle, signOutUser } from "@/app/actions/auth";
import TradeJournal from "@/app/components/trade-journal";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { TradeDto } from "@/lib/trades/types";

function serializeTrade(trade: {
  id: string;
  symbol: string;
  side: string;
  entry: number;
  exit: number | null;
  quantity: number;
  openedAt: Date;
  closedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TradeDto {
  return {
    id: trade.id,
    symbol: trade.symbol,
    side: trade.side as TradeDto["side"],
    entry: trade.entry,
    exit: trade.exit,
    quantity: trade.quantity,
    openedAt: trade.openedAt.toISOString(),
    closedAt: trade.closedAt?.toISOString() ?? null,
    notes: trade.notes,
    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
  };
}

function SignInScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
      <section className="w-full max-w-sm border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">
            MarketPilot
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal">
            Trade journal
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Sign in to track executions, review outcomes, and keep your trading
            notes in one private workspace.
          </p>
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center border border-zinc-700 bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Sign in with Google
          </button>
        </form>
      </section>
    </main>
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
      symbol: true,
      side: true,
      entry: true,
      exit: true,
      quantity: true,
      openedAt: true,
      closedAt: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serializedTrades = trades.map(serializeTrade);
  const displayName =
    session.user?.name ?? session.user?.email ?? "Authenticated trader";

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              MarketPilot
            </p>
            <h1 className="truncate text-lg font-semibold tracking-normal text-zinc-950">
              Trade Journal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <p className="hidden max-w-56 truncate text-sm text-zinc-600 sm:block">
              {displayName}
            </p>
            <form action={signOutUser}>
              <button
                type="submit"
                className="h-9 border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <TradeJournal initialTrades={serializedTrades} />
    </main>
  );
}
