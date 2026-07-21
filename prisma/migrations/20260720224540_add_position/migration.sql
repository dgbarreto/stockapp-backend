-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avg_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "positions_user_id_ticker_key" ON "positions"("user_id", "ticker");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
