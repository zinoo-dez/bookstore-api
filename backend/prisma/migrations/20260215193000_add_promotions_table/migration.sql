-- CreateEnum
CREATE TYPE "PromotionDiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "PromotionCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "PromotionDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maxDiscountAmount" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCode_code_key" ON "PromotionCode"("code");
CREATE INDEX "PromotionCode_isActive_idx" ON "PromotionCode"("isActive");
CREATE INDEX "PromotionCode_startsAt_endsAt_idx" ON "PromotionCode"("startsAt", "endsAt");
