import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find or create a dev user to own the seed data
  const seedEmail = process.env.SEED_USER_EMAIL ?? "dev@marketpilot.test";
  let user = await prisma.user.findFirst({ where: { email: seedEmail } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Dev User",
        email: seedEmail,
      },
    });
  }

  // Create a playbook
  const playbook = await prisma.playbook.upsert({
    where: { id: "seed-playbook-001" },
    update: {},
    create: {
      id: "seed-playbook-001",
      userId: user.id,
      name: "Momentum Breakout",
      description: "High-momentum breakout setups with tight stops",
      color: "#6C5DD3",
      rules: ["Entry on breakout candle close", "Stop below prior pivot", "Target 2R minimum"],
    },
  });

  // Seed trades: mix of wins, losses, and breakeven
  const trades = [
    { symbol: "ES", side: "long",  riskDollars: 200, rMultiple:  2.5, daysAgo: 1,  idea: "FOMC breakout above 5220 resistance" },
    { symbol: "NQ", side: "short", riskDollars: 150, rMultiple: -1.0, daysAgo: 2,  idea: "Failed breakout at ATH, reversal short" },
    { symbol: "MES", side: "long", riskDollars: 50,  rMultiple:  0.0, daysAgo: 3,  idea: "Morning gap fill — stopped at breakeven" },
    { symbol: "CL",  side: "long", riskDollars: 300, rMultiple:  1.8, daysAgo: 4,  idea: "Inventory draw surprise catalyst" },
    { symbol: "GC",  side: "short",riskDollars: 100, rMultiple: -0.5, daysAgo: 5,  idea: "DXY strength, gold rejected at 2350" },
    { symbol: "ES",  side: "long", riskDollars: 250, rMultiple:  3.1, daysAgo: 6,  idea: "Bullish engulfing on 1h chart at VWAP" },
    { symbol: "NQ",  side: "long", riskDollars: 175, rMultiple: -1.0, daysAgo: 7,  idea: "Tech earnings gap continuation" },
    { symbol: "RTY", side: "short",riskDollars: 125, rMultiple:  1.2, daysAgo: 8,  idea: "Small-cap index failed breakout short" },
    { symbol: "MNQ", side: "long", riskDollars: 75,  rMultiple:  0.0, daysAgo: 9,  idea: "Scalp — scratched near entry" },
    { symbol: "ES",  side: "short",riskDollars: 200, rMultiple: -1.0, daysAgo: 10, idea: "Distribution top, reversal short" },
  ];

  for (const t of trades) {
    const openedAt = new Date();
    openedAt.setUTCDate(openedAt.getUTCDate() - t.daysAgo);
    openedAt.setUTCHours(14, 30, 0, 0); // 9:30 AM ET

    const trade = await prisma.trade.create({
      data: {
        userId: user.id,
        playbookId: playbook.id,
        symbol: t.symbol,
        side: t.side,
        riskDollars: t.riskDollars,
        rMultiple: t.rMultiple,
        openedAt,
      },
    });

    await prisma.journalEntry.create({
      data: {
        userId: user.id,
        tradeId: trade.id,
        tradeIdea: t.idea,
        confluences: "Volume confirmation, trend alignment",
      },
    });
  }

  console.log(`Seeded ${trades.length} trades for user ${user.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
