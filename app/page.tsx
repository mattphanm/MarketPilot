import { signInWithGoogle } from "@/app/actions/auth";
import TradeJournal from "@/app/components/trade-journal";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { PlaybookDto } from "@/lib/playbooks/types";
import type { TradeDto } from "@/lib/trades/types";

function serializeTrade(trade: {
  id: string;
  playbookId: string | null;
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
    playbookId: trade.playbookId,
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

function SignInScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1E1B2E] px-6 text-white">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-2xl">
        <div className="mb-8">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#6C5DD3] text-sm font-bold text-white">
            MP
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#A8A5C1]">
            MarketPilot
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-normal">
            Futures trading journal
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#C9C6DD]">
            Sign in to review completed trades, playbooks, analytics, and
            journal entries in one private workspace.
          </p>
        </div>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-md bg-[#6C5DD3] px-4 text-sm font-semibold text-white transition hover:bg-[#5B4BC7] focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-[#1E1B2E]"
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
      playbookId: true,
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
