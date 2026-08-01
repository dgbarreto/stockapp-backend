-- CreateTable
CREATE TABLE "known_tickers" (
    "ticker" TEXT NOT NULL,
    "asset_type" "AssetType" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "known_tickers_pkey" PRIMARY KEY ("ticker")
);
