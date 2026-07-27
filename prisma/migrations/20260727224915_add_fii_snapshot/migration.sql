-- CreateTable
CREATE TABLE "fii_snapshots" (
    "ticker" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "segment" TEXT,
    "management_type" TEXT,
    "close_price" DOUBLE PRECISION NOT NULL,
    "book_value_per_share" DOUBLE PRECISION,
    "pvp" DOUBLE PRECISION,
    "dividend_yield_ttm" DOUBLE PRECISION,
    "net_asset_value" DOUBLE PRECISION,
    "shares_outstanding" DOUBLE PRECISION,
    "total_shareholders" INTEGER,

    CONSTRAINT "fii_snapshots_pkey" PRIMARY KEY ("ticker","fetched_at")
);
