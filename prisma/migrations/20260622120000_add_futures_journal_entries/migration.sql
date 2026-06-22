ALTER TABLE "Trade" ADD COLUMN "riskDollars" DOUBLE PRECISION NOT NULL DEFAULT 1;
ALTER TABLE "Trade" ADD COLUMN "rMultiple" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "tradeIdea" TEXT NOT NULL,
    "confluences" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JournalEntry_tradeId_key" ON "JournalEntry"("tradeId");
CREATE INDEX "JournalEntry_userId_createdAt_idx" ON "JournalEntry"("userId", "createdAt");

ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
