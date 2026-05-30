-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('SIMULATED', 'MERCADO_PAGO', 'STRIPE', 'PAGSEGURO', 'ASAAS');

-- CreateEnum
CREATE TYPE "CoinPurchaseStatus" AS ENUM ('PENDING', 'APROVED', 'REJECTED', 'CANCELED', 'REFUNDED');

-- CreateTable
CREATE TABLE "CoinPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'SIMULATED',
    "status" "CoinPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "externalReference" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "checkoutUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoinPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoinPurchase_externalReference_key" ON "CoinPurchase"("externalReference");

-- CreateIndex
CREATE INDEX "CoinPurchase_userId_idx" ON "CoinPurchase"("userId");

-- CreateIndex
CREATE INDEX "CoinPurchase_status_idx" ON "CoinPurchase"("status");

-- CreateIndex
CREATE INDEX "CoinPurchase_provider_idx" ON "CoinPurchase"("provider");

-- CreateIndex
CREATE INDEX "CoinPurchase_createdAt_idx" ON "CoinPurchase"("createdAt");

-- AddForeignKey
ALTER TABLE "CoinPurchase" ADD CONSTRAINT "CoinPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
