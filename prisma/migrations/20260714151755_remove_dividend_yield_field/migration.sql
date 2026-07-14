/*
  Warnings:

  - You are about to drop the column `dividend_yield` on the `quote_snapshots` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "quote_snapshots" DROP COLUMN "dividend_yield";
