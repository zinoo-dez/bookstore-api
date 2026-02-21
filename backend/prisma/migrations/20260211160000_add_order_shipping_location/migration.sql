-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "shippingFullName" TEXT,
ADD COLUMN "shippingEmail" TEXT,
ADD COLUMN "shippingPhone" TEXT,
ADD COLUMN "shippingAddress" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingState" TEXT,
ADD COLUMN "shippingZipCode" TEXT,
ADD COLUMN "shippingCountry" TEXT;

-- CreateIndex
CREATE INDEX "Order_shippingCity_idx" ON "Order"("shippingCity");

-- CreateIndex
CREATE INDEX "Order_shippingState_idx" ON "Order"("shippingState");

-- CreateIndex
CREATE INDEX "Order_shippingCountry_idx" ON "Order"("shippingCountry");
