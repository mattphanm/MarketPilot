import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  const playbook = await prisma.playbook.upsert({
    where: { id: "seed-playbook-001" },
    update: {
      name: "Momentum Breakout",
      description: "High-momentum breakout setups with tight stops",
      color: "#6C5DD3",
      rules: [
        "Entry on breakout candle close",
        "Stop below prior pivot",
        "Target 2R minimum",
      ],
    },
    create: {
      id: "seed-playbook-001",
      userId: user.id,
      name: "Momentum Breakout",
      description: "High-momentum breakout setups with tight stops",
      color: "#6C5DD3",
      rules: [
        "Entry on breakout candle close",
        "Stop below prior pivot",
        "Target 2R minimum",
      ],
    },
  });

  await prisma.trade.deleteMany({
    where: {
      userId: user.id,
      playbookId: playbook.id,
    },
  });

  // Spread trades across range boundaries so Dashboard/Recharts changes are visible.
  const trades = [
    {
      id: "seed-trade-001",
      symbol: "ES",
      side: "long",
      riskDollars: 200,
      rMultiple: 2.5,
      daysAgo: 1,
      idea: "FOMC breakout above resistance",
    },
    {
      id: "seed-trade-002",
      symbol: "NQ",
      side: "short",
      riskDollars: 150,
      rMultiple: -1.0,
      daysAgo: 8,
      idea: "Failed breakout at high of day",
    },
    {
      id: "seed-trade-003",
      symbol: "MES",
      side: "long",
      riskDollars: 50,
      rMultiple: 0.0,
      daysAgo: 17,
      idea: "Morning gap fill scratched near entry",
    },
    {
      id: "seed-trade-004",
      symbol: "CL",
      side: "long",
      riskDollars: 300,
      rMultiple: 1.8,
      daysAgo: 28,
      idea: "Inventory draw continuation",
    },
    {
      id: "seed-trade-005",
      symbol: "GC",
      side: "short",
      riskDollars: 100,
      rMultiple: -0.5,
      daysAgo: 31,
      idea: "Gold rejected resistance after dollar strength",
    },
    {
      id: "seed-trade-006",
      symbol: "ES",
      side: "long",
      riskDollars: 250,
      rMultiple: 3.1,
      daysAgo: 45,
      idea: "Bullish engulfing at VWAP",
    },
    {
      id: "seed-trade-007",
      symbol: "NQ",
      side: "long",
      riskDollars: 175,
      rMultiple: -1.0,
      daysAgo: 62,
      idea: "Tech earnings continuation failed",
    },
    {
      id: "seed-trade-008",
      symbol: "RTY",
      side: "short",
      riskDollars: 125,
      rMultiple: 1.2,
      daysAgo: 88,
      idea: "Small-cap failed breakout short",
    },
    {
      id: "seed-trade-009",
      symbol: "MNQ",
      side: "long",
      riskDollars: 75,
      rMultiple: 0.5,
      daysAgo: 120,
      idea: "Spring pullback continuation",
    },
    {
      id: "seed-trade-010",
      symbol: "ES",
      side: "short",
      riskDollars: 200,
      rMultiple: -1.0,
      daysAgo: 165,
      idea: "Distribution top reversal short",
    },
    {
      id: "seed-trade-011",
      symbol: "MGC",
      side: "long",
      riskDollars: 80,
      rMultiple: 2.0,
      daysAgo: 220,
      idea: "Prior-year gold breakout retest",
    },
    {
      id: "seed-trade-012",
      symbol: "MCL",
      side: "short",
      riskDollars: 120,
      rMultiple: -0.75,
      daysAgo: 370,
      idea: "Prior-year crude trend exhaustion",
    },
  ];

  for (const t of trades) {
    const openedAt = new Date();
    openedAt.setUTCDate(openedAt.getUTCDate() - t.daysAgo);
    openedAt.setUTCHours(14, 30, 0, 0); // 9:30 AM ET

    const trade = await prisma.trade.create({
      data: {
        id: t.id,
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
