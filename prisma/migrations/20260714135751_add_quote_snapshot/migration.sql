/*
  Warnings:

  - You are about to drop the `ConnectionCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ConnectionCheck";

-- CreateTable
CREATE TABLE "quote_snapshots" (
    "ticker" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "close_price" DOUBLE PRECISION NOT NULL,
    "market_cap" DOUBLE PRECISION NOT NULL,
    "pl" DOUBLE PRECISION NOT NULL,
    "pvp" DOUBLE PRECISION NOT NULL,
    "ev_ebitda" DOUBLE PRECISION NOT NULL,
    "roe" DOUBLE PRECISION NOT NULL,
    "roic" DOUBLE PRECISION NOT NULL,
    "net_margin" DOUBLE PRECISION NOT NULL,
    "gross_margin" DOUBLE PRECISION NOT NULL,
    "dividend_yield" DOUBLE PRECISION NOT NULL,
    "net_debt_ebitda" DOUBLE PRECISION NOT NULL,
    "lpa" DOUBLE PRECISION NOT NULL,
    "vpa" DOUBLE PRECISION NOT NULL,
    "ebitda" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "quote_snapshots_pkey" PRIMARY KEY ("ticker","fetched_at")
);
