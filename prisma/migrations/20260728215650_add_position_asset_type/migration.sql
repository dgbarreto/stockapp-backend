-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('STOCK', 'FII');

-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "asset_type" "AssetType" NOT NULL DEFAULT 'STOCK';
