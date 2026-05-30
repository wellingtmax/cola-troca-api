/*
  Warnings:

  - The values [APROVED] on the enum `CoinPurchaseStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CoinPurchaseStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'REFUNDED');
ALTER TABLE "public"."CoinPurchase" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CoinPurchase" ALTER COLUMN "status" TYPE "CoinPurchaseStatus_new" USING ("status"::text::"CoinPurchaseStatus_new");
ALTER TYPE "CoinPurchaseStatus" RENAME TO "CoinPurchaseStatus_old";
ALTER TYPE "CoinPurchaseStatus_new" RENAME TO "CoinPurchaseStatus";
DROP TYPE "public"."CoinPurchaseStatus_old";
ALTER TABLE "CoinPurchase" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
